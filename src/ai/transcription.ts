// Transcription service - multi-provider

import { config } from '../config';
import { TranscriptionResult, TranscriptionSegment, TranscribeConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function transcribeAudio(
  audioPath: string,
  jobConfig: any,
  transcribeConfig: TranscribeConfig = {}
): Promise<TranscriptionResult> {
  interface ProviderConfig {
    provider: 'openai' | 'anthropic' | 'google' | 'nvidia' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    priority: number;
    enabled: boolean;
  }

  // Determine provider
  const providers: ProviderConfig[] = (jobConfig.providers || [
    { provider: 'openai' as const, model: config.openaiModel, apiKey: config.openaiApiKey, priority: 1, enabled: !!config.openaiApiKey },
    { provider: 'anthropic' as const, model: config.anthropicModel, apiKey: config.anthropicApiKey, priority: 2, enabled: !!config.anthropicApiKey },
    { provider: 'google' as const, model: config.googleModel, apiKey: config.googleApiKey, priority: 3, enabled: !!config.googleApiKey },
    { provider: 'nvidia' as const, model: config.nvidiaModel, apiKey: config.nvidiaApiKey, baseUrl: config.nvidiaBaseUrl, priority: 4, enabled: !!config.nvidiaApiKey },
  ]).filter((p: ProviderConfig) => p.enabled);

  if (providers.length === 0) {
    throw new Error('No AI provider configured for transcription');
  }

  // Sort by priority
  providers.sort((a: ProviderConfig, b: ProviderConfig) => a.priority - b.priority);

  // Try each provider
  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[Transcription] Trying provider: ${provider.provider} (${provider.model})`);

      let result: TranscriptionResult;

      switch (provider.provider) {
        case 'openai':
          result = await transcribeWithOpenAI(audioPath, provider, transcribeConfig);
          break;
        case 'anthropic':
          result = await transcribeWithAnthropic(audioPath, provider, transcribeConfig);
          break;
        case 'google':
          result = await transcribeWithGoogle(audioPath, provider, transcribeConfig);
          break;
        case 'nvidia':
          result = await transcribeWithNVIDIA(audioPath, provider, transcribeConfig);
          break;
        default:
          throw new Error(`Unknown provider: ${provider.provider}`);
      }

      console.log(`[Transcription] Success with ${provider.provider}`);
      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Transcription] Provider ${provider.provider} failed:`, lastError.message);
      continue;
    }
  }

  throw new Error(`All transcription providers failed. Last error: ${lastError?.message}`);
}

async function transcribeWithOpenAI(
  audioPath: string,
  provider: any,
  transcribeConfig: TranscribeConfig
): Promise<TranscriptionResult> {
  // OpenAI Whisper API
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  });

  const fs = await import('fs');
  const audioFile = fs.createReadStream(audioPath);

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: provider.model || 'whisper-1',
    language: transcribeConfig.language,
    prompt: transcribeConfig.prompt,
    temperature: transcribeConfig.temperature ?? 0.2,
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  });

  const segments: TranscriptionSegment[] = (response.segments || []).map((seg: any, idx: number) => ({
    id: uuidv4(),
    jobId: '', // Will be set by caller
    startTime: seg.start,
    endTime: seg.end,
    text: seg.text.trim(),
    confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.9,
    language: response.language || transcribeConfig.language || 'en',
  }));

  return {
    id: uuidv4(),
    jobId: '',
    videoId: '',
    segments,
    fullText: response.text,
    language: response.language || transcribeConfig.language || 'en',
    duration: response.duration || segments[segments.length - 1]?.endTime || 0,
    provider: 'openai',
    model: provider.model || 'whisper-1',
    createdAt: new Date(),
  };
}

async function transcribeWithAnthropic(
  audioPath: string,
  provider: any,
  transcribeConfig: TranscribeConfig
): Promise<TranscriptionResult> {
  // Anthropic doesn't have direct audio transcription
  // This would need to be implemented via a different approach
  // For now, throw to fallback to next provider
  throw new Error('Anthropic transcription not yet implemented');
}

async function transcribeWithGoogle(
  audioPath: string,
  provider: any,
  transcribeConfig: TranscribeConfig
): Promise<TranscriptionResult> {
  // Google Speech-to-Text or Gemini
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(provider.apiKey);
  const model = genAI.getGenerativeModel({ model: provider.model });

  // For now, throw to fallback - would need file upload to Google AI
  throw new Error('Google transcription not yet implemented');
}

// Local transcription using whisper.cpp (if available)
export async function transcribeLocal(
  audioPath: string,
  transcribeConfig: TranscribeConfig
): Promise<TranscriptionResult> {
  // Could integrate whisper.cpp or faster-whisper here
  throw new Error('Local transcription not yet implemented');
}

// NVIDIA Parakeet transcription
async function transcribeWithNVIDIA(
  audioPath: string,
  provider: any,
  transcribeConfig: TranscribeConfig
): Promise<TranscriptionResult> {
  const fs = await import('fs');
  const formData = new (await import('form-data')).default();
  formData.append('file', fs.createReadStream(audioPath));
  formData.append('model', provider.model || 'parakeet-tdt-1.1b');
  if (transcribeConfig.language) {
    formData.append('language', transcribeConfig.language);
  }
  if (transcribeConfig.prompt) {
    formData.append('prompt', transcribeConfig.prompt);
  }
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const response = await fetch(`${provider.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API error: ${response.status} ${errorText}`);
  }

  interface NVIDIAResponse {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      avg_logprob?: number;
    }>;
  }

  const result = await response.json() as NVIDIAResponse;

  const segments: TranscriptionSegment[] = (result.segments || []).map((seg: any, idx: number) => ({
    id: uuidv4(),
    jobId: '',
    startTime: seg.start,
    endTime: seg.end,
    text: seg.text.trim(),
    confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.9,
    language: result.language || transcribeConfig.language || 'en',
  }));

  return {
    id: uuidv4(),
    jobId: '',
    videoId: '',
    segments,
    fullText: result.text,
    language: result.language || transcribeConfig.language || 'en',
    duration: result.duration || segments[segments.length - 1]?.endTime || 0,
    provider: 'nvidia',
    model: provider.model || 'parakeet-tdt-1.1b',
    createdAt: new Date(),
  };
}