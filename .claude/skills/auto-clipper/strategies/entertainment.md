# Strategy: Entertainment Content

Optimized clipping for comedy, reactions, sketches, and general entertainment.

## Characteristics

- Humor-focused
- Reaction-based
- Skit/sketch format
- Personality-driven
- Short attention spans

## Highlight Detection Tuning

```typescript
const entertainmentConfig = {
  customPrompt: `
    This is entertainment/comedy content. Find highlights that are:
    1. Funniest moments (punchlines, reactions)
    2. Relatable observations
    3. Unexpected twists
    4. Character breaks/improv
    5. Audience interaction
    6. Visual gags
    7. Callback/running jokes
    
    Timing is critical - preserve comedic pacing
  `,
  minDuration: 10,
  maxDuration: 45,
  targetCount: 15,
  keywords: ['funny', 'hilarious', 'wait', 'omg', 'no way', 'literally', 'actually', 'guys', 'chat', 'reaction', 'meme'],
};
```

## Clip Planning

```typescript
// Entertainment clips:
// 1. Ultra-short (10-30s) for maximum retention
// 2. Hook in first 0.5s
// 3. Single joke/bit per clip
// 4. Loop-friendly endings
```

## Subtitle Strategy

- **Meme-style**: Bold, caps for emphasis
- **Timing**: Match comedic beats exactly
- **Reaction text**: "POV: you when..."

## Metadata Strategy

```typescript
const entertainmentMetadata = {
  style: 'viral',
  category: 'comedy',
  hashtags: ['#comedy', '#funny', '#relatable', '#meme', '#fyp', '#viral', '#humor'],
  titleFormat: 'POV: {Relatable Situation}',
  descriptionFormat: '{Punchline} 😂 Follow for more!',
};
```

## Platform Optimization

| Platform | Style |
|----------|-------|
| TikTok | Fast cuts, trending audio, duets |
| Reels | Aesthetic, shareable, remixable |
| Shorts | Loopable, searchable hooks |