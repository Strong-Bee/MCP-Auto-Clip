# Strategy: Gaming Content

Optimized clipping for gaming highlights, gameplay, and esports.

## Characteristics

- High visual activity
- Key moments: kills, clutches, fails, wins
- Fast pacing
- UI elements (health, ammo, map)
- Commentary/reaction audio

## Highlight Detection Tuning

```typescript
const gamingConfig = {
  customPrompt: `
    This is a gaming video. Find highlights that are:
    1. High-skill plays (clutches, multikills, outplays)
    2. Funny fails and ragdoll moments
    3. Close calls and near-death escapes
    4. Game-winning moments
    5. Glitches and exploits
    6. Reaction moments (streamer facecam)
    7. Ranked/competitive tension
    
    Look for: visual cues (kill feed, medals), audio cues (hype, frustration)
  `,
  minDuration: 10,
  maxDuration: 45,
  targetCount: 12,
  keywords: ['clutch', 'ace', 'knocked', 'headshot', 'insane', 'crazy', 'unbelievable', 'lucky', 'glitch', 'bug', 'win', 'victory', 'ranked'],
};
```

## Clip Planning

```typescript
// Gaming clips:
// 1. Short, punchy (10-30s optimal)
// 2. Include 3s context before/after key moment
// 3. Preserve UI readability (don't crop HUD)
// 4. Sync with audio reactions
```

## Subtitle Strategy

- **Minimal**: Let gameplay speak
- **Callouts**: "INSANE CLUTCH", "1v4"
- **Position**: Top or side to avoid HUD
- **Style**: Gaming aesthetic (bold, outline)

## Metadata Strategy

```typescript
const gamingMetadata = {
  style: 'hype',
  category: 'gaming',
  hashtags: ['#gaming', '#clips', '#{gameName}', '#clutch', '#fyp', '#gamer'],
  titleFormat: '{Game}: {Moment Type} - {Descriptor}',
  descriptionFormat: '{Streamer} hits {moment} in {game}. Full stream: {link}',
};
```

## Platform Optimization

| Platform | Format |
|----------|--------|
| TikTok | Vertical gameplay, trending sounds |
| Reels | Clean gameplay, minimal UI |
| Shorts | Search: "{game} best plays" |

## Quality Considerations

- High bitrate for fast motion (4M+)
- 60fps preferred
- Preserve HUD visibility
- Audio: game sound + commentary balance