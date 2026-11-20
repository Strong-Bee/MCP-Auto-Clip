// Metadata generation service

import { ClipSpec, TranscriptionResult, ClipMetadata, MetadataConfig, EngagementPrediction, JobConfig } from '../types';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export async function generateMetadata(
  clip: ClipSpec,
  transcription: TranscriptionResult,
  jobConfig: JobConfig
): Promise<ClipMetadata> {
  // Get relevant transcript text for this clip
  const clipSegments = transcription.segments.filter(
    seg => seg.endTime > clip.startTime && seg.startTime < clip.endTime
  );

  const clipText = clipSegments.map(s => s.text).join(' ');

  // Try AI-generated metadata first
  const aiMetadata = await tryAIMetadata(clip, clipText, transcription, jobConfig);

  if (aiMetadata) {
    return aiMetadata;
  }

  // Fallback to template-based metadata
  return generateFallbackMetadata(clip, clipText, transcription, jobConfig);
}

async function tryAIMetadata(
  clip: ClipSpec,
  clipText: string,
  transcription: TranscriptionResult,
  jobConfig: JobConfig
): Promise<ClipMetadata | null> {
  const providers = jobConfig.providers || [
    { provider: 'openai' as const, model: config.openaiModel, apiKey: config.openaiApiKey, priority: 1, enabled: !!config.openaiApiKey },
    { provider: 'anthropic' as const, model: config.anthropicModel, apiKey: config.anthropicApiKey, priority: 2, enabled: !!config.anthropicApiKey },
    { provider: 'google' as const, model: config.googleModel, apiKey: config.googleApiKey, priority: 3, enabled: !!config.googleApiKey },
    { provider: 'nvidia' as const, model: config.nvidiaModel, apiKey: config.nvidiaApiKey, priority: 4, enabled: !!config.nvidiaApiKey },
  ].filter(p => p.enabled);

  if (providers.length === 0) return null;

  providers.sort((a, b) => a.priority - b.priority);

  const metadataConfig: MetadataConfig = {
    style: 'viral',
    platform: 'tiktok',
    includeHashtags: true,
    maxTags: 10,
  };

  for (const provider of providers) {
    try {
      console.log(`[Metadata] Trying provider: ${provider.provider}`);

      let metadata: ClipMetadata;

      switch (provider.provider) {
        case 'openai':
          metadata = await generateMetadataOpenAI(clip, clipText, transcription, provider, metadataConfig);
          break;
        case 'anthropic':
          metadata = await generateMetadataAnthropic(clip, clipText, transcription, provider, metadataConfig);
          break;
        case 'google':
          metadata = await generateMetadataGoogle(clip, clipText, transcription, provider, metadataConfig);
          break;
        case 'nvidia':
          metadata = await generateMetadataNVIDIA(clip, clipText, transcription, provider, metadataConfig);
          break;
        default:
          continue;
      }

      console.log(`[Metadata] Success with ${provider.provider}`);
      return metadata;

    } catch (error) {
      console.warn(`[Metadata] Provider ${provider.provider} failed:`, error);
      continue;
    }
  }

  return null;
}

async function generateMetadataOpenAI(
  clip: ClipSpec,
  clipText: string,
  transcription: TranscriptionResult,
  provider: any,
  metadataConfig: MetadataConfig
): Promise<ClipMetadata> {
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseUrl });

  const prompt = buildMetadataPrompt(clipText, transcription, metadataConfig);

  const response = await openai.chat.completions.create({
    model: provider.model,
    messages: [
      { role: 'system', content: 'You are a social media expert. Generate viral-optimized metadata for short-form videos. Return JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response');

  return parseMetadataResponse(content, clip, metadataConfig);
}

async function generateMetadataAnthropic(
  clip: ClipSpec,
  clipText: string,
  transcription: TranscriptionResult,
  provider: any,
  metadataConfig: MetadataConfig
): Promise<ClipMetadata> {
  const { Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: provider.apiKey });

  const prompt = buildMetadataPrompt(clipText, transcription, metadataConfig);

  const response = await anthropic.messages.create({
    model: provider.model,
    max_tokens: 2000,
    temperature: 0.7,
    system: 'You are a social media expert. Generate viral-optimized metadata for short-form videos. Return JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
  if (!content) throw new Error('Empty response');

  return parseMetadataResponse(content, clip, metadataConfig);
}

async function generateMetadataGoogle(
  clip: ClipSpec,
  clipText: string,
  transcription: TranscriptionResult,
  provider: any,
  metadataConfig: MetadataConfig
): Promise<ClipMetadata> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(provider.apiKey);
  const model = genAI.getGenerativeModel({ model: provider.model });

  const prompt = buildMetadataPrompt(clipText, transcription, metadataConfig);

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
  });

  const content = response.response.text();
  if (!content) throw new Error('Empty response');

  return parseMetadataResponse(content, clip, metadataConfig);
}

async function generateMetadataNVIDIA(
  clip: ClipSpec,
  clipText: string,
  transcription: TranscriptionResult,
  provider: any,
  metadataConfig: MetadataConfig
): Promise<ClipMetadata> {
  // NVIDIA doesn't have a direct LLM API for metadata generation
  // Use OpenAI-compatible endpoint if available, otherwise fallback
  throw new Error('NVIDIA metadata generation not yet implemented');
}

function buildMetadataPrompt(
  clipText: string,
  transcription: TranscriptionResult,
  config: MetadataConfig
): string {
  return `
Video clip transcript:
"${clipText}"

Full video language: ${transcription.language}
Clip duration: ${Math.round((transcription.segments.find(s => s.endTime > clipText.length)?.endTime || 60) - (transcription.segments.find(s => s.startTime < clipText.length)?.startTime || 0))}s

Generate metadata for ${config.platform} (${config.style} style):
${config.includeHashtags ? `- Include ${config.maxTags} relevant hashtags` : '- No hashtags'}
- Title: Catchy, under 100 chars
- Description: Engaging, under 300 chars
- Tags: 5-10 relevant keywords
- Category: entertainment/education/lifestyle/tech/etc
- Viral score prediction: 0-1

Return JSON:
{
  "title": "...",
  "description": "...",
  "tags": ["tag1", "tag2"],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "category": "entertainment",
  "viralScore": 0.85,
  "engagementPrediction": {
    "views": 100000,
    "likes": 10000,
    "comments": 500,
    "shares": 1000,
    "retentionRate": 0.65
  }
}
`;
}

function parseMetadataResponse(content: string, clip: ClipSpec, config: MetadataConfig): ClipMetadata {
  const parsed = JSON.parse(content);

  const engagement: EngagementPrediction = {
    views: parsed.engagementPrediction?.views || 10000,
    likes: parsed.engagementPrediction?.likes || 500,
    comments: parsed.engagementPrediction?.comments || 50,
    shares: parsed.engagementPrediction?.shares || 100,
    retentionRate: parsed.engagementPrediction?.retentionRate || 0.5,
  };

  return {
    title: parsed.title || 'Untitled Clip',
    description: parsed.description || '',
    tags: parsed.tags || [],
    hashtags: config.includeHashtags ? (parsed.hashtags || []) : [],
    category: parsed.category || 'entertainment',
    viralScore: Math.max(0, Math.min(1, parsed.viralScore || 0.5)),
    engagementPrediction: engagement,
    thumbnailPath: undefined,
  };
}

function generateFallbackMetadata(
  clip: ClipSpec,
  clipText: string,
  transcription: TranscriptionResult,
  jobConfig: JobConfig
): ClipMetadata {
  // Extract keywords from text
  const words = clipText.toLowerCase()
    .replace(/[.,!?;:()\[\]{}"]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 20);

  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;

  const topKeywords = Object.entries(freq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([w]) => w);

  // Generate hashtags
  const hashtags = topKeywords.map(k => `#${k.replace(/[^a-z0-9]/g, '')}`);

  return {
    title: clipText.slice(0, 80) + (clipText.length > 80 ? '...' : ''),
    description: clipText.slice(0, 250) + (clipText.length > 250 ? '...' : ''),
    tags: topKeywords,
    hashtags,
    category: 'entertainment',
    viralScore: 0.5,
    engagementPrediction: {
      views: 5000,
      likes: 250,
      comments: 25,
      shares: 50,
      retentionRate: 0.45,
    },
  };
}