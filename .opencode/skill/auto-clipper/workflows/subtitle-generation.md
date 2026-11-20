# Workflow: Subtitle Generation

Create and burn subtitles for video clips with proper styling and synchronization.

## Purpose

Generate accurate, well-timed, and visually appealing subtitles for short-form vertical videos.

## Steps

### 1. Get Transcript Segments for Clip
```typescript
const transcription = await transcriptionRepository.findByJobId(jobId);
const clipSegments = transcription.segments.filter(
  seg => seg.endTime > clip.startTime && seg.startTime < clip.endTime
);
```

### 2. Generate SRT Subtitles
```typescript
const srtContent = generateSRT(clipSegments, clip.startTime);

// SRT format:
// 1
// 00:00:00,000 --> 00:00:03,500
// Hello world
//
// 2
// 00:00:03,500 --> 00:00:07,200
// This is a subtitle
```

### 3. Write Subtitle File
```typescript
const subtitleDir = path.join(config.tempPath, 'subtitles', jobId);
await fs.promises.mkdir(subtitleDir, { recursive: true });

const subtitlePath = path.join(subtitleDir, `${clip.id}.srt`);
await fs.promises.writeFile(subtitlePath, srtContent, 'utf-8');
```

### 4. Generate ASS (Advanced SubStation Alpha) for Styling
```typescript
const style: SubtitleStyle = {
  fontFamily: config.subtitleFontFamily || 'Arial',
  fontSize: config.subtitleFontSize || 24,
  fontColor: config.subtitleFontColor || '#FFFFFF',
  outlineColor: config.subtitleOutlineColor || '#000000',
  outlineWidth: config.subtitleOutlineWidth || 2,
  backgroundColor: '#000000',
  backgroundOpacity: 0.5,
  position: config.subtitlePosition || 'bottom',
  margin: config.subtitleMargin || 50,
};

const assContent = generateASSSubtitles(clipSegments, clip.startTime, style);
const assPath = subtitlePath.replace('.srt', '.ass');
await fs.promises.writeFile(assPath, assContent, 'utf-8');
```

### 5. Burn Subtitles During Render
```typescript
// In renderVideo(), subtitle filter is applied:
const subtitleFilter = `subtitles='${subtitlePath}':force_style='FontName=${style.fontFamily},FontSize=${style.fontSize},PrimaryColour=&H${style.fontColor.replace('#', '')},OutlineColour=&H${style.outlineColor.replace('#', '')},Outline=${style.outlineWidth},MarginV=${marginV},Alignment=${alignment}'`;

filters.push(subtitleFilter);
```

## Subtitle Styling Guidelines

### Default Style (Vertical Video Optimized)
- **Font**: Arial (system font, widely available)
- **Size**: 24pt (readable on mobile)
- **Color**: White (#FFFFFF)
- **Outline**: Black (#000000), 2px
- **Background**: Semi-transparent black (50%)
- **Position**: Bottom, 50px margin
- **Alignment**: Center-bottom (ASS alignment 2)

### Platform-Specific Adjustments

| Platform | Font Size | Position | Margin |
|----------|-----------|----------|--------|
| TikTok | 28 | Bottom | 60 |
| Reels | 26 | Bottom | 50 |
| Shorts | 24 | Bottom | 50 |

### Timing Rules

1. **Minimum display time**: 1 second per subtitle
2. **Maximum characters per line**: 32 (portrait width)
3. **Maximum lines**: 2
4. **Gap between subtitles**: 50ms minimum
5. **Sync tolerance**: ±200ms acceptable

## Synchronization Verification

```typescript
async function checkSubtitleSync(subtitlePath: string, videoDuration: number): Promise<number> {
  // Parse SRT, compare first/last subtitle times to video duration
  // Returns offset in seconds (positive = subs late, negative = subs early)
  
  const offset = await calculateOffset(subtitlePath, videoDuration);
  
  if (Math.abs(offset) > 1) {
    console.warn(`Subtitle sync offset: ${offset.toFixed(1)}s`);
    // Could auto-adjust by shifting all timestamps
  }
  
  return offset;
}
```

## Error Handling

| Error | Resolution |
|-------|------------|
| `NO_SEGMENTS` | Clip has no transcript segments - create empty subtitle |
| `SRT_PARSE_FAILED` | Regenerate with simpler format |
| `ASS_RENDER_FAILED` | Fall back to SRT-only burning |
| `FONT_NOT_FOUND` | Use system fallback font |
| `SYNC_OFFSET` | Re-generate with adjusted timestamps |

## Output

- `subtitlePath`: Path to SRT file (used for burning)
- `assPath`: Path to ASS file (for reference/styling)
- Subtitles burned into final video during render