// Highlights detection service - multi-provider

import { config } from '../config';
import { TranscriptionResult, Highlight, HighlightConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function detectHighlights(
  transcription: TranscriptionResult,
  jobConfig: any,
  highlightConfig: Partial<HighlightConfig> = {}
): Promise<Highlight[]> {
  interface ProviderConfig {
    provider: 'openai' | 'anthropic' | 'google' | 'nvidia' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    priority: number;
    enabled: boolean;
  }

  const providers: ProviderConfig[] = (jobConfig.providers || [
    { provider: 'openai' as const, model: config.openaiModel, apiKey: config.openaiApiKey, priority: 1, enabled: !!config.openaiApiKey },
    { provider: 'anthropic' as const, model: config.anthropicModel, apiKey: config.anthropicApiKey, priority: 2, enabled: !!config.anthropicApiKey },
    { provider: 'google' as const, model: config.googleModel, apiKey: config.googleApiKey, priority: 3, enabled: !!config.googleApiKey },
    { provider: 'nvidia' as const, model: config.nvidiaModel, apiKey: config.nvidiaApiKey, baseUrl: config.nvidiaBaseUrl, priority: 4, enabled: !!config.nvidiaApiKey },
  ]).filter((p: ProviderConfig) => p.enabled);

  if (providers.length === 0) {
    throw new Error('No AI provider configured for highlight detection');
  }

  providers.sort((a: ProviderConfig, b: ProviderConfig) => a.priority - b.priority);

  // Build default config, then override with provided config
  const defaultConfig: HighlightConfig = {
    minDuration: highlightConfig.minDuration ?? jobConfig.minClipDuration ?? 15,
    maxDuration: highlightConfig.maxDuration ?? jobConfig.maxClipDuration ?? 120,
    targetCount: highlightConfig.targetCount ?? jobConfig.maxClips ?? 10,
    keywords: highlightConfig.keywords ?? jobConfig.keywords,
    customPrompt: highlightConfig.customPrompt ?? jobConfig.customPrompt,
  };

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      console.log(`[Highlights] Trying provider: ${provider.provider} (${provider.model})`);

      let highlights: Highlight[];

      switch (provider.provider) {
        case 'openai':
          highlights = await detectHighlightsWithOpenAI(transcription, provider, defaultConfig);
          break;
        case 'anthropic':
          highlights = await detectHighlightsWithAnthropic(transcription, provider, defaultConfig);
          break;
        case 'google':
          highlights = await detectHighlightsWithGoogle(transcription, provider, defaultConfig);
          break;
        case 'nvidia':
          highlights = await detectHighlightsWithNVIDIA(transcription, provider, defaultConfig);
          break;
        default:
          throw new Error(`Unknown provider: ${provider.provider}`);
      }

      console.log(`[Highlights] Success with ${provider.provider}, found ${highlights.length} highlights`);
      return highlights;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[Highlights] Provider ${provider.provider} failed:`, lastError.message);
      continue;
    }
  }

  // Fallback: simple heuristic-based highlights
  console.log('[Highlights] Falling back to heuristic-based detection');
  return fallbackHighlightDetection(transcription, defaultConfig);
}

async function detectHighlightsWithOpenAI(
  transcription: TranscriptionResult,
  provider: any,
  highlightConfig: HighlightConfig
): Promise<Highlight[]> {
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  });

  const prompt = buildHighlightPrompt(transcription, highlightConfig);

  const response = await openai.chat.completions.create({
    model: provider.model,
    messages: [
      { role: 'system', content: 'You are an expert video editor. Identify the most engaging, viral-worthy segments from transcripts for short-form vertical video (9:16). Return JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);
  return parseHighlights(parsed, transcription, highlightConfig);
}

async function detectHighlightsWithAnthropic(
  transcription: TranscriptionResult,
  provider: any,
  highlightConfig: HighlightConfig
): Promise<Highlight[]> {
  const { Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: provider.apiKey });

  const prompt = buildHighlightPrompt(transcription, highlightConfig);

  const response = await anthropic.messages.create({
    model: provider.model,
    max_tokens: 4000,
    temperature: 0.3,
    system: 'You are an expert video editor. Identify the most engaging, viral-worthy segments from transcripts for short-form vertical video (9:16). Return JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
  if (!content) throw new Error('Empty response from Anthropic');

  const parsed = JSON.parse(content);
  return parseHighlights(parsed, transcription, highlightConfig);
}

async function detectHighlightsWithGoogle(
  transcription: TranscriptionResult,
  provider: any,
  highlightConfig: HighlightConfig
): Promise<Highlight[]> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(provider.apiKey);
  const model = genAI.getGenerativeModel({ model: provider.model });

  const prompt = buildHighlightPrompt(transcription, highlightConfig);

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const content = response.response.text();
  if (!content) throw new Error('Empty response from Google');

  const parsed = JSON.parse(content);
  return parseHighlights(parsed, transcription, highlightConfig);
}

async function detectHighlightsWithNVIDIA(
  transcription: TranscriptionResult,
  provider: any,
  highlightConfig: HighlightConfig
): Promise<Highlight[]> {
  // NVIDIA doesn't have a direct LLM API for highlight detection
  // Use OpenAI-compatible endpoint if available, otherwise fallback
  // For now, throw to fallback to heuristic
  throw new Error('NVIDIA highlight detection not yet implemented');
}

function buildHighlightPrompt(transcription: TranscriptionResult, config: HighlightConfig): string {
  const segmentsText = transcription.segments
    .map((s, i) => `[${i}] ${s.startTime.toFixed(1)}-${s.endTime.toFixed(1)}: ${s.text}`)
    .join('\n');

  return `
Transcript (${transcription.duration.toFixed(1)}s total):
${segmentsText}

Find ${config.targetCount} highlight segments for viral short-form video (9:16 portrait).
Constraints:
- Min duration: ${config.minDuration}s
- Max duration: ${config.maxDuration}s
- Target count: ${config.targetCount}
${config.keywords ? `- Keywords to prioritize: ${config.keywords.join(', ')}` : ''}
${config.customPrompt ? `- Custom instruction: ${config.customPrompt}` : ''}

Return JSON:
{
  "highlights": [
    {
      "start_time": 10.5,
      "end_time": 25.3,
      "score": 0.92,
      "reason": "Emotional hook with strong visual potential",
      "keywords": ["emotional", "storytelling", "relatable"],
      "segment_indices": [3, 4, 5]
    }
  ]
}

Score 0-1 based on: viral potential, emotional impact, visual storytelling, completeness, engagement hooks.
Only return highlights meeting duration constraints. Segments must be contiguous.
`;
}

function parseHighlights(parsed: any, transcription: TranscriptionResult, config: HighlightConfig): Highlight[] {
  const highlights: Highlight[] = [];

  for (const h of parsed.highlights || []) {
    const startTime = Math.max(0, Math.min(h.start_time, transcription.duration));
    const endTime = Math.max(startTime + config.minDuration, Math.min(h.end_time, transcription.duration));
    const duration = endTime - startTime;

    if (duration < config.minDuration || duration > config.maxDuration) continue;

    // Map segment indices to IDs
    const segmentIds = (h.segment_indices || [])
      .map((idx: number) => transcription.segments[idx]?.id)
      .filter(Boolean);

    highlights.push({
      id: uuidv4(),
      jobId: '',
      startTime,
      endTime,
      score: Math.max(0, Math.min(1, h.score || 0.5)),
      reason: h.reason || 'AI-detected highlight',
      keywords: h.keywords || [],
      transcriptSegmentIds: segmentIds,
    });
  }

  // Sort by score descending
  highlights.sort((a, b) => b.score - a.score);

  // Limit to target count
  return highlights.slice(0, config.targetCount);
}

function fallbackHighlightDetection(transcription: TranscriptionResult, config: HighlightConfig): Highlight[] {
  const highlights: Highlight[] = [];
  const segments = transcription.segments;

  // Simple heuristic: find segments with high engagement keywords
  const engagementKeywords = [
    'wow', 'amazing', 'incredible', 'unbelievable', 'shocking', 'secret',
    'never', 'always', 'best', 'worst', 'top', 'mistake', 'wrong',
    'you won\'t believe', 'this is why', 'here\'s why', 'the truth',
    'actually', 'honestly', 'literally', 'guys', 'wait for it',
  ];

  let currentHighlight: { start: number; end: number; segments: number[]; score: number; keywords: string[] } | null = null;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const text = seg.text.toLowerCase();

    // Calculate engagement score
    let score = 0.3; // base score
    const foundKeywords: string[] = [];

    for (const kw of engagementKeywords) {
      if (text.includes(kw)) {
        score += 0.1;
        foundKeywords.push(kw);
      }
    }

    // Boost for questions
    if (text.includes('?')) score += 0.05;

    // Boost for exclamations
    if (text.includes('!')) score += 0.05;

    // Boost for high confidence
    score *= seg.confidence;

    if (score > 0.5 || foundKeywords.length > 0) {
      if (!currentHighlight) {
        currentHighlight = { start: seg.startTime, end: seg.endTime, segments: [i], score, keywords: foundKeywords };
      } else {
        currentHighlight.end = seg.endTime;
        currentHighlight.segments.push(i);
        currentHighlight.score = Math.max(currentHighlight.score, score);
        currentHighlight.keywords.push(...foundKeywords);
      }
    } else if (currentHighlight) {
      // End current highlight
      const duration = currentHighlight.end - currentHighlight.start;
      if (duration >= config.minDuration && duration <= config.maxDuration) {
        highlights.push({
          id: uuidv4(),
          jobId: '',
          startTime: currentHighlight.start,
          endTime: currentHighlight.end,
          score: Math.min(1, currentHighlight.score),
          reason: 'Heuristic: engagement keywords detected',
          keywords: [...new Set(currentHighlight.keywords)],
          transcriptSegmentIds: currentHighlight.segments.map(idx => segments[idx].id),
        });
      }
      currentHighlight = null;
    }
  }

  // Don't forget the last highlight
  if (currentHighlight) {
    const duration = currentHighlight.end - currentHighlight.start;
    if (duration >= config.minDuration && duration <= config.maxDuration) {
      highlights.push({
        id: uuidv4(),
        jobId: '',
        startTime: currentHighlight.start,
        endTime: currentHighlight.end,
        score: Math.min(1, currentHighlight.score),
        reason: 'Heuristic: engagement keywords detected',
        keywords: [...new Set(currentHighlight.keywords)],
        transcriptSegmentIds: currentHighlight.segments.map(idx => segments[idx].id),
      });
    }
  }

  // Sort by score and limit
  highlights.sort((a, b) => b.score - a.score);
  return highlights.slice(0, config.targetCount);
}