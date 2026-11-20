# Workflow: Find Highlights

Detect engaging highlight segments from video transcription using multi-provider AI.

## Purpose

Identify the most viral-worthy moments in a video based on transcript analysis.

## Prerequisites

- Video ingested and transcribed
- At least one AI provider configured (OpenAI, Anthropic, Google)

## Steps

### 1. Get Transcription
```typescript
const transcription = await transcriptionRepository.findByJobId(jobId);
if (!transcription) throw new Error('Transcription not found');
```

### 2. Build Highlight Detection Config
```typescript
const highlightConfig = {
  minDuration: jobConfig.minClipDuration || 15,
  maxDuration: jobConfig.maxClipDuration || 120,
  targetCount: jobConfig.maxClips || 10,
  keywords: jobConfig.keywords,
  customPrompt: jobConfig.customPrompt,
};
```

### 3. Run Multi-Provider Detection
```typescript
const highlights = await detectHighlights(transcription, jobConfig, highlightConfig);

// Provider fallback order:
// 1. OpenAI (GPT-4o) - Best for structured analysis
// 2. Anthropic (Claude 3.5 Sonnet) - Good reasoning
// 3. Google (Gemini 1.5 Pro) - Large context
// 4. Heuristic fallback - Keyword-based (no API needed)
```

### 4. Validate Highlights
```typescript
const validHighlights = highlights.filter(h => {
  const duration = h.endTime - h.startTime;
  return duration >= highlightConfig.minDuration 
      && duration <= highlightConfig.maxDuration
      && h.score > 0.3;
});
```

### 5. Enrich with Context
```typescript
for (const highlight of validHighlights) {
  // Get surrounding transcript for context
  const contextSegments = transcription.segments.filter(s => 
    s.endTime > highlight.startTime - 5 && s.startTime < highlight.endTime + 5
  );
  
  highlight.context = contextSegments.map(s => s.text).join(' ');
  highlight.transcriptPreview = transcription.segments
    .filter(s => s.startTime >= highlight.startTime && s.endTime <= highlight.endTime)
    .map(s => s.text).join(' ');
}
```

### 6. Score & Rank
```typescript
// Highlights already scored by AI (0-1)
// Sort by score descending
validHighlights.sort((a, b) => b.score - a.score);

// Add ranking
validHighlights.forEach((h, i) => h.rank = i + 1);
```

### 7. Save to Database
```typescript
for (const highlight of validHighlights) {
  highlight.jobId = jobId;
  await highlightRepository.create(highlight);
}
```

## Output

Array of `Highlight` objects:
```typescript
{
  id: string,
  jobId: string,
  startTime: number,
  endTime: number,
  score: number,        // 0-1 viral potential
  reason: string,       // Why this was selected
  keywords: string[],   // Key terms
  transcriptSegmentIds: string[],
  rank: number,
  context: string,
  transcriptPreview: string,
}
```

## Scoring Factors (AI evaluates)

| Factor | Weight | Description |
|--------|--------|-------------|
| Hook Strength | 25% | Opening engagement potential |
| Information Value | 20% | Useful/unique content |
| Emotional Impact | 15% | Triggers emotional response |
| Context Completeness | 15% | Self-contained narrative |
| Storytelling | 15% | Narrative arc quality |
| Audio/Visual Quality | 10% | Production quality indicators |

## Heuristic Fallback

When no AI provider available, uses keyword-based detection:
- Engagement keywords: "wow", "amazing", "secret", "never", "best", "worst"
- Questions and exclamations boost score
- High-confidence transcript segments preferred
- Contiguous segments grouped into highlights

## Custom Prompt Examples

```typescript
// Podcast
customPrompt: 'Find moments with actionable advice, surprising facts, or emotional stories'

// Interview
customPrompt: 'Identify the most quotable answers and reactive moments'

// Educational
customPrompt: 'Locate clear explanations, demonstrations, and "aha!" moments'

// Gaming
customPrompt: 'Find high-skill plays, funny fails, and exciting clutch moments'
```

## Error Handling

| Error | Resolution |
|-------|------------|
| `NO_TRANSCRIPTION` | Run transcription first |
| `NO_AI_PROVIDER` | Configure API key or use heuristic |
| `ALL_PROVIDERS_FAILED` | Check API keys, network; falls back to heuristic |
| `NO_HIGHLIGHTS_FOUND` | Lower thresholds, check video content |