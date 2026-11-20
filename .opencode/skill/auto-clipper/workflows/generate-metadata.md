# Workflow: Generate Metadata

Create viral-optimized metadata for clips including titles, descriptions, hashtags, and engagement predictions.

## Purpose

Generate social media-ready metadata that maximizes discoverability and engagement.

## Prerequisites

- Clip rendered and quality-checked
- Transcript available for context
- At least one AI provider configured

## Steps

### 1. Get Clip Transcript Context
```typescript
const transcription = await transcriptionRepository.findByJobId(jobId);
const clipSegments = transcription.segments.filter(
  seg => seg.endTime > clip.startTime && seg.startTime < clip.endTime
);
const clipText = clipSegments.map(s => s.text).join(' ');
```

### 2. Configure Metadata Generation
```typescript
const metadataConfig: MetadataConfig = {
  style: jobConfig.metadataStyle || 'viral',
  platform: jobConfig.targetPlatform || 'tiktok',
  includeHashtags: true,
  maxTags: 10,
};
```

### 3. Try AI-Generated Metadata
```typescript
const metadata = await generateMetadata(clip, transcription, jobConfig);

// Provider fallback: OpenAI > Anthropic > Google > Template fallback
```

### 4. Fallback: Template-Based Metadata
```typescript
function generateFallbackMetadata(clip, clipText, transcription, jobConfig) {
  // Extract keywords from transcript
  const words = clipText.toLowerCase()
    .replace(/[.,!?;:()[\]{}"]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 20);
  
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  
  const topKeywords = Object.entries(freq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([w]) => w);
  
  return {
    title: clipText.slice(0, 80) + (clipText.length > 80 ? '...' : ''),
    description: clipText.slice(0, 250) + (clipText.length > 250 ? '...' : ''),
    tags: topKeywords,
    hashtags: topKeywords.map(k => `#${k.replace(/[^a-z0-9]/g, '')}`),
    category: 'entertainment',
    viralScore: 0.5,
    engagementPrediction: {
      views: 5000,
      likes: 250,
      comments: 25,
      shares: 50,
      retentionRate: 0.45,
    },
    thumbnailPath: undefined,
  };
}
```

### 5. Score Viral Potential
```typescript
const viralScore = await scoreViral(clip, metadata, jobConfig, { platform: 'tiktok' });

// Viral factors (weighted):
// - Hook Strength: 25%
// - Emotional Resonance: 20%
// - Visual Storytelling: 15%
// - Trend Alignment: 15%
// - Completion Rate: 15%
// - Shareability: 10%
```

### 6. Enhance Metadata with Viral Score
```typescript
metadata.viralScore = viralScore.score;
metadata.viralFactors = viralScore.factors;
metadata.engagementPrediction = viralScore.prediction;
```

### 7. Save Metadata
```typescript
await clipRepository.setMetadata(clip.id, metadata);
await viralScoreRepository.create(viralScore);
```

## Output

`ClipMetadata` object:
```typescript
{
  title: string,           // Catchy, <100 chars
  description: string,     // Engaging, <300 chars
  tags: string[],          // 5-10 keywords
  hashtags: string[],      // Platform-optimized tags
  category: string,        // entertainment/education/lifestyle/tech
  viralScore: number,      // 0-1 overall viral potential
  viralFactors: ViralFactor[], // Detailed breakdown
  engagementPrediction: {
    views: number,
    likes: number,
    comments: number,
    shares: number,
    retentionRate: number,
  },
  thumbnailPath?: string,
}
```

## AI Prompt Strategy

### System Prompt
```
You are a social media expert. Generate viral-optimized metadata for short-form videos. Return JSON only.
```

### User Prompt Template
```
Video clip transcript:
"{clipText}"

Full video language: {language}
Clip duration: {duration}s

Generate metadata for {platform} ({style} style):
- Include {maxTags} relevant hashtags
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
```

## Platform Optimization

| Platform | Hashtag Style | Title Length | Description Focus |
|----------|---------------|--------------|-------------------|
| TikTok | Trending + niche | <100 chars | Hook + CTA |
| Reels | Niche + branded | <125 chars | Value + save prompt |
| Shorts | Search-optimized | <100 chars | Question + answer |

## Viral Scoring Factors

```typescript
// Hook Strength (25%): Title patterns, questions, numbers, secrets
// Emotional Resonance (20%): Emotion keywords across categories
// Visual Storytelling (15%): Duration sweet spot, subtitles, aspect ratio
// Trend Alignment (15%): Trending hashtags, category relevance
// Completion Rate (15%): Optimal duration, narrative structure, CTA
// Shareability (10%): Relatable triggers, educational value
```

## Error Handling

| Error | Resolution |
|-------|------------|
| `NO_AI_PROVIDER` | Use template fallback |
| `AI_PARSE_FAILED` | Retry with stricter JSON prompt |
| `LOW_CONFIDENCE` | Blend AI + template results |
| `NO_TRANSCRIPT` | Use clip timing + video analysis only |