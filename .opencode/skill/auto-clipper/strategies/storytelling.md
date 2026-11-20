# Strategy: Storytelling Content

Optimized clipping for narrative, vlog, and story-driven videos.

## Characteristics

- Narrative arc (beginning, middle, end)
- Character-driven
- Emotional journey
- Visual storytelling
- 5-20 minutes typical

## Highlight Detection Tuning

```typescript
const storytellingConfig = {
  customPrompt: `
    This is a storytelling/narrative video. Find highlights that are:
    1. Emotional peaks (joy, surprise, tension, resolution)
    2. Plot twists and revelations
    3. Character-defining moments
    4. Visual climaxes (beautiful shots, action)
    5. Relatable human moments
    6. Satisfying payoffs/setups
    7. Universal themes (love, loss, growth, struggle)
    
    Maintain narrative coherence - don't break the story flow
  `,
  minDuration: 15,
  maxDuration: 60,
  targetCount: 6,
  keywords: ['never forget', 'changed my life', 'realized', 'moment', 'turning point', 'finally', 'suddenly', 'unexpected', 'beautiful', 'heart'],
};
```

## Clip Planning

```typescript
// Storytelling clips:
// 1. Can be sequential (part 1, 2, 3) or standalone vignettes
// 2. Preserve emotional arc within each clip
// 3. Hook = inciting incident or question
// 4. Ending = emotional resolution or cliffhanger
```

## Subtitle Strategy

- **Cinematic style**: Clean, minimal, lower third
- **Pacing**: Match emotional beats
- **Music cues**: Subtitle timing respects soundtrack

## Metadata Strategy

```typescript
const storytellingMetadata = {
  style: 'cinematic',
  category: 'entertainment',
  hashtags: ['#storytime', '#storytelling', '#vlog', '#life', '#moment', '#emotional'],
  titleFormat: '"{Key Line}" - {Story Title}',
  descriptionFormat: 'Part {n} of {story}. {Emotional hook}. Full story: {link}',
};
```

## Common Patterns

| Pattern | Clip Strategy |
|---------|---------------|
| Journey/transformation | Before → during → after |
| Mystery/reveal | Setup → investigation → reveal |
| Challenge overcome | Problem → struggle → victory |
| Relationship moment | Tension → connection → meaning |
| Nostalgia/reflection | Memory → reflection → insight |