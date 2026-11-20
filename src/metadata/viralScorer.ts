// Viral scoring service

import { ClipSpec, ClipMetadata, ViralScore, ViralFactor, ViralConfig, EngagementPrediction } from '../types';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export async function scoreViral(
  clip: ClipSpec,
  metadata: ClipMetadata,
  jobConfig: any,
  viralConfig: ViralConfig = { platform: 'tiktok' }
): Promise<ViralScore> {
  const platform = viralConfig.platform;

  // Calculate viral factors
  const factors: ViralFactor[] = [];

  // Factor 1: Hook strength (first 3 seconds)
  const hookScore = calculateHookScore(clip, metadata);
  factors.push({
    name: 'hook_strength',
    weight: 0.25,
    value: hookScore,
    description: 'Engagement hook in first 3 seconds',
  });

  // Factor 2: Emotional resonance
  const emotionScore = calculateEmotionScore(metadata);
  factors.push({
    name: 'emotional_resonance',
    weight: 0.20,
    value: emotionScore,
    description: 'Emotional impact and relatability',
  });

  // Factor 3: Visual storytelling potential
  const visualScore = calculateVisualScore(clip);
  factors.push({
    name: 'visual_storytelling',
    weight: 0.15,
    value: visualScore,
    description: 'Visual narrative clarity',
  });

  // Factor 4: Trend alignment
  const trendScore = calculateTrendScore(metadata, platform);
  factors.push({
    name: 'trend_alignment',
    weight: 0.15,
    value: trendScore,
    description: 'Alignment with current platform trends',
  });

  // Factor 5: Completion rate prediction
  const completionScore = calculateCompletionScore(clip, metadata);
  factors.push({
    name: 'completion_rate',
    weight: 0.15,
    value: completionScore,
    description: 'Likelihood viewers watch to end',
  });

  // Factor 6: Shareability
  const shareScore = calculateShareability(metadata);
  factors.push({
    name: 'shareability',
    weight: 0.10,
    value: shareScore,
    description: 'Likelihood of shares and saves',
  });

  // Calculate weighted score
  const totalScore = factors.reduce((sum, f) => sum + f.value * f.weight, 0);

  // Generate engagement prediction based on score
  const prediction = predictEngagement(totalScore, platform, clip.duration);

  return {
    id: uuidv4(),
    clipId: clip.id,
    score: Math.max(0, Math.min(1, totalScore)),
    factors,
    prediction,
  };
}

function calculateHookScore(clip: ClipSpec, metadata: ClipMetadata): number {
  let score = 0.3; // Base score

  // Title analysis
  const title = metadata.title.toLowerCase();
  const hookPatterns = [
    /^(how|why|what|when|where|who)/,
    /^(stop|don't|never|always|this|here's)/,
    /secret|mistake|wrong|truth|revealed|exposed/,
    /\?$/,
    /^\d+ (things|ways|tips|reasons|secrets)/,
  ];

  for (const pattern of hookPatterns) {
    if (pattern.test(title)) {
      score += 0.1;
    }
  }

  // Description has question or call to action
  const desc = metadata.description.toLowerCase();
  if (desc.includes('?') || desc.includes('comment') || desc.includes('follow')) {
    score += 0.1;
  }

  return Math.min(1, score);
}

function calculateEmotionScore(metadata: ClipMetadata): number {
  const text = (metadata.title + ' ' + metadata.description).toLowerCase();

  const emotionKeywords = {
    positive: ['amazing', 'incredible', 'love', 'best', 'happy', 'joy', 'beautiful', 'wonderful', 'fantastic', 'awesome'],
    negative: ['hate', 'worst', 'terrible', 'awful', 'angry', 'furious', 'disgusted', 'shocked', 'horrified'],
    surprise: ['unbelievable', 'shocking', 'mind blown', 'crazy', 'insane', 'wild', 'unexpected', 'twist'],
    fear: ['scary', 'dangerous', 'risk', 'warning', 'careful', 'avoid', 'never do'],
    curiosity: ['secret', 'hidden', 'unknown', 'mystery', 'discover', 'reveal', 'behind the scenes'],
  };

  let score = 0.3;
  let matchedTypes = 0;

  for (const [type, keywords] of Object.entries(emotionKeywords)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += 0.08;
        matchedTypes++;
        break;
      }
    }
  }

  // Bonus for multiple emotion types
  if (matchedTypes >= 2) score += 0.1;
  if (matchedTypes >= 3) score += 0.1;

  return Math.min(1, score);
}

function calculateVisualScore(clip: ClipSpec): number {
  let score = 0.5; // Base score

  // Duration sweet spot
  if (clip.duration >= 15 && clip.duration <= 30) score += 0.2;
  else if (clip.duration >= 30 && clip.duration <= 60) score += 0.1;
  else if (clip.duration < 10) score -= 0.2;

  // Has subtitle (assumed if metadata exists)
  if (clip.subtitlePath) score += 0.1;

  // Aspect ratio is 9:16 (portrait)
  score += 0.2;

  return Math.min(1, score);
}

function calculateTrendScore(metadata: ClipMetadata, platform: string): number {
  let score = 0.4;

  // Hashtag analysis
  const hashtags = metadata.hashtags.map(h => h.toLowerCase());

  // Platform-specific trending tags (simplified)
  const trendingTags: Record<string, string[]> = {
    tiktok: ['fyp', 'foryou', 'viral', 'trending', 'xyzbca', 'duet', 'stitch', 'pov', 'storytime', 'hack'],
    reels: ['reels', 'explore', 'viral', 'trending', 'reelsinstagram', 'instagood', 'reelsviral'],
    shorts: ['shorts', 'youtubeshorts', 'viral', 'trending', 'shortsvideo', 'subscribe'],
    generic: ['viral', 'trending', 'popular', 'mustwatch'],
  };

  const platformTrending = trendingTags[platform] || trendingTags.generic;

  let trendMatches = 0;
  for (const tag of hashtags) {
    const cleanTag = tag.replace('#', '');
    if (platformTrending.includes(cleanTag)) {
      trendMatches++;
    }
  }

  score += Math.min(0.3, trendMatches * 0.05);

  // Category relevance
  const trendingCategories = ['entertainment', 'comedy', 'education', 'lifestyle', 'tech', 'fitness'];
  if (trendingCategories.includes(metadata.category.toLowerCase())) {
    score += 0.1;
  }

  return Math.min(1, score);
}

function calculateCompletionScore(clip: ClipSpec, metadata: ClipMetadata): number {
  let score = 0.5;

  // Optimal duration for completion
  if (clip.duration <= 15) score += 0.3; // Very high completion for ultra-short
  else if (clip.duration <= 30) score += 0.2;
  else if (clip.duration <= 60) score += 0.1;
  else score -= 0.1;

  // Has narrative structure (implied by metadata)
  if (metadata.description.length > 50) score += 0.1;

  // Call to action at end
  const desc = metadata.description.toLowerCase();
  if (desc.includes('part 2') || desc.includes('follow for') || desc.includes('wait for it')) {
    score += 0.1;
  }

  return Math.min(1, score);
}

function calculateShareability(metadata: ClipMetadata): number {
  let score = 0.4;

  // Relatable content indicators
  const shareTriggers = [
    'relatable', 'same', 'me', 'us', 'everyone', 'nobody',
    'tag', 'share', 'send to', 'show this', 'must see',
    'life hack', 'tip', 'trick', 'secret', 'money saving',
  ];

  const text = (metadata.title + ' ' + metadata.description).toLowerCase();

  for (const trigger of shareTriggers) {
    if (text.includes(trigger)) {
      score += 0.05;
    }
  }

  // Educational value
  if (metadata.category === 'education' || metadata.category === 'tutorial') {
    score += 0.15;
  }

  // Emotional content gets shared more
  if (metadata.viralScore > 0.7) score += 0.1;

  return Math.min(1, score);
}

function predictEngagement(
  viralScore: number,
  platform: string,
  duration: number
): EngagementPrediction {
  // Base multipliers by platform
  const platformMultipliers: Record<string, { views: number; engagement: number }> = {
    tiktok: { views: 1.0, engagement: 1.0 },
    reels: { views: 0.8, engagement: 1.2 },
    shorts: { views: 1.2, engagement: 0.9 },
    generic: { views: 0.7, engagement: 0.8 },
  };

  const mult = platformMultipliers[platform] || platformMultipliers.generic;

  // Base predictions scaled by viral score
  const baseViews = 10000 * mult.views;
  const baseEngagement = mult.engagement;

  // Score heavily influences predictions (exponential-ish)
  const scoreMultiplier = Math.pow(viralScore, 0.5) * 10; // 0-10x

  const views = Math.round(baseViews * scoreMultiplier * (1 + Math.random() * 0.5));
  const likeRate = 0.05 + viralScore * 0.1; // 5-15%
  const commentRate = 0.005 + viralScore * 0.02; // 0.5-2.5%
  const shareRate = 0.002 + viralScore * 0.01; // 0.2-1.2%
  const retentionRate = 0.3 + viralScore * 0.5; // 30-80%

  return {
    views,
    likes: Math.round(views * likeRate),
    comments: Math.round(views * commentRate),
    shares: Math.round(views * shareRate),
    retentionRate: Math.max(0, Math.min(1, retentionRate)),
  };
}