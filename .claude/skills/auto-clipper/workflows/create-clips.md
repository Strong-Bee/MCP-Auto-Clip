# Workflow: Create Clips

Plan and render video clips from detected highlights.

## Purpose

Convert highlight segments into rendered vertical video clips with proper timing, cropping, and quality.

## Prerequisites

- Highlights detected and saved
- Video ingested with audio extracted
- FFmpeg available

## Steps

### 1. Get Highlights for Job
```typescript
const highlights = await highlightRepository.findByJobId(jobId);
if (highlights.length === 0) throw new Error('No highlights found');
```

### 2. Plan Clips
```typescript
const clipPlan = await planClips(highlights, jobConfig);

// Returns:
// - highlights: selected highlights (top N by score)
// - clips: ClipSpec array with timing
// - totalDuration: combined duration
// - estimatedRenderTime: rough estimate
```

### 3. Adjust Timing to Sentence Boundaries
```typescript
const transcription = await transcriptionRepository.findByJobId(jobConfig.jobId);

for (const clip of clipPlan.clips) {
  const adjusted = adjustClipTiming(clip, transcription, 1); // 1s padding
  clip.startTime = adjusted.startTime;
  clip.endTime = adjusted.endTime;
  clip.duration = adjusted.endTime - adjusted.startTime;
}
```

### 4. Optimize for Target Platform
```typescript
const platform = jobConfig.targetPlatform || 'tiktok';
clipPlan.clips = optimizeClipsForPlatform(clipPlan.clips, platform);

// Platform limits:
// - TikTok: max 60s, recommended 15s
// - Reels: max 90s, recommended 30s
// - Shorts: max 60s, recommended 15s
```

### 5. Generate Subtitles for Each Clip
```typescript
for (const clip of clipPlan.clips) {
  const subtitlePath = await generateSubtitles(clip, transcription, jobConfig);
  clip.subtitlePath = subtitlePath;
}
```

### 6. Render Clips (Parallel with Concurrency Limit)
```typescript
const outputDir = jobConfig.outputDir || config.outputPath;
const concurrency = 2; // Limit concurrent FFmpeg processes

for (let i = 0; i < clipPlan.clips.length; i += concurrency) {
  const batch = clipPlan.clips.slice(i, i + concurrency);
  
  await Promise.all(batch.map(async (clip, idx) => {
    const outputPath = path.join(outputDir, `${jobId}_clip_${clip.id}.mp4`);
    
    await renderVideo({
      inputPath: jobConfig.inputPath,
      outputPath,
      startTime: clip.startTime,
      duration: clip.duration,
      width: 1080,
      height: 1920,
      subtitlePath: clip.subtitlePath,
      subtitleStyle: jobConfig.subtitleStyle,
      preset: 'medium',
      crf: 23,
    });
    
    clip.outputPath = outputPath;
    clip.status = 'completed';
  }));
}
```

### 7. Save Clip Specs
```typescript
for (const clip of clipPlan.clips) {
  await clipRepository.create(clip);
}
```

## Output

Array of rendered `ClipSpec` objects with:
- `outputPath`: Path to final video file
- `startTime`, `endTime`, `duration`: Final timing
- `subtitlePath`: Burned-in subtitle file
- `status`: 'completed' or 'failed'
- `viralScore`: Set after metadata generation

## Clip Timing Rules

1. **Minimum duration**: 15 seconds (configurable)
2. **Maximum duration**: 120 seconds (configurable)
3. **Sentence alignment**: Extend/trim to nearest sentence boundary (±1s)
4. **Total duration cap**: Target × 1.5 (e.g., 90s for 60s target)
5. **Platform limits**: Enforced per platform

## Smart Crop (9:16 Portrait)

```typescript
// FFmpeg filter chain for 9:16
scale=1080:1920:force_original_aspect_ratio=decrease,
pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black

// For face-aware cropping (future enhancement):
// crop=1080:1920:(face_x-540):(face_y-960)
```

## Render Settings

| Parameter | Value | Notes |
|-----------|-------|-------|
| Resolution | 1080x1920 | 9:16 portrait |
| Video Codec | libx264 | H.264 |
| Preset | medium | Speed/quality balance |
| CRF | 23 | Constant quality |
| Bitrate | 2M | Target bitrate |
| Audio Codec | aac | Standard |
| Audio Bitrate | 128k | Good quality |
| FPS | 30 | Smooth playback |
| Faststart | enabled | Streaming optimized |

## Error Handling

| Error | Resolution |
|-------|------------|
| `RENDER_FAILED` | Retry with faster preset, check disk space |
| `SUBTITLE_SYNC` | Regenerate subtitles, check timing |
| `ASPECT_RATIO` | Verify filter chain, check input dimensions |
| `DISK_FULL` | Clean temp, increase storage |
| `FFMPEG_NOT_FOUND` | Install FFmpeg, verify PATH |

## Retry Logic

- Max 2 retries per clip
- On failure: try `preset: 'fast'`, then `preset: 'veryfast'`
- Log each attempt with parameters
- Mark clip as `failed` after all retries exhausted