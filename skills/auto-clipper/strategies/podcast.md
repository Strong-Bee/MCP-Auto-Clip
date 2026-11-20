# Strategy: Podcast Content

Optimized clipping approach for podcast and conversation-style videos.

## Characteristics

- Long-form (30min - 3hrs)
- 1-4 speakers
- Audio-focused, static or simple video
- Topic-driven segments
- Natural conversation flow

## Highlight Detection Tuning

```typescript
const podcastConfig = {
  customPrompt: `
    This is a podcast/conversation video. Find highlights that are:
    1. Standalone insights or advice (actionable takeaways)
    2. Surprising or counterintuitive statements
    3. Emotional or vulnerable moments
    4. Debates or strong disagreements
    5. Funny/entertaining exchanges
    6. Expert credentials or authority moments
    7. Storytelling with clear beginning/middle/end
    
    Avoid: filler words, tangents, sponsor reads, introductions/outros
  `,
  minDuration: 20,  // Podcasts need more context
  maxDuration: 90,  // Allow longer for complete thoughts
  targetCount: 8,
  keywords: ['advice', 'tip', 'secret', 'mistake', 'learned', 'realized', 'never', 'always', 'best', 'worst'],
};
```

## Clip Planning

```typescript
// For podcasts, prioritize:
// 1. Complete thoughts (sentence-aligned boundaries)
// 2. Speaker changes as natural cut points
// 3. Topic transitions
// 4. Q&A segments (question + answer pairs)

function planPodcastClips(highlights, config) {
  // Extend clips to include full speaker turns
  // Merge adjacent highlights from same speaker/topic
  // Ensure each clip has context (who, what, why)
}
```

## Subtitle Strategy

- **Speaker labels**: Include speaker names if diarization available
- **Larger font**: 28pt for readability on audio-first content
- **Longer display**: Minimum 1.5s per subtitle
- **Position**: Bottom with extra margin (70px) for podcast overlays

## Metadata Strategy

```typescript
const podcastMetadata = {
  style: 'educational',
  category: 'education', // or 'business', 'health', etc.
  hashtags: ['#podcastclips', '#podcasthighlights', '#learnontiktok', '#advice', '#tips'],
  titleFormat: '"{Key Quote}" - {Guest Name} on {Podcast Name}',
  descriptionFormat: '{Guest} shares {topic}. Full episode: {link}',
};
```

## Viral Scoring Adjustments

- Boost "Information Value" weight to 30%
- Boost "Hook Strength" for actionable advice
- Reduce "Visual Storytelling" weight (static video)
- Consider "Audio Quality" as proxy for production value

## Platform Optimization

| Platform | Approach |
|----------|----------|
| TikTok | Fast-paced, hook-heavy, trending audio |
| Reels | Educational value, save-worthy, carousel potential |
| Shorts | Search-optimized titles, clear value proposition |

## Common Podcast Patterns

| Pattern | Clip Strategy |
|---------|---------------|
| "The biggest mistake..." | Hook: mistake → explanation → lesson |
| "Nobody talks about..." | Secret/reveal format |
| "If I could start over..." | Regret/advice format |
| Guest introduction | Authority establishment clip |
| Rapid-fire Q&A | Compilation of best answers |
| Storytelling arc | Beginning → tension → resolution |

## Quality Considerations

- Static camera: Ensure crop doesn't cut speaker
- Audio-only segments: Add waveform visualization
- Multiple speakers: Label speakers in subtitles
- Long pauses: Trim aggressively but keep natural rhythm

## Example Workflow

```typescript
const result = await mcp.call('process_video', {
  inputPath: './podcast-episode-42.mp4',
  config: {
    ...defaultConfig,
    customPrompt: podcastConfig.customPrompt,
    minClipDuration: 20,
    maxClipDuration: 90,
    targetPlatform: 'tiktok',
    metadataStyle: 'educational',
  }
});
```