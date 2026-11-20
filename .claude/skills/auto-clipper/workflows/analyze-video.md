# Workflow: Video Analysis

Analyze a video for technical details and clipping potential using FFprobe and AI.

## Purpose

Gather comprehensive video metadata and identify structural characteristics that inform clipping decisions.

## Steps

### 1. Get Technical Metadata
```typescript
const info = await mcp.call('get_video_info', { videoPath });

// Key metrics for clipping decisions
const metrics = {
  duration: info.duration,
  resolution: `${info.width}x${info.height}`,
  aspectRatio: (info.width / info.height).toFixed(3),
  fps: info.fps,
  videoCodec: info.videoCodec,
  audioCodec: info.audioCodec,
  videoBitrate: info.videoBitrate,
  audioBitrate: info.audioBitrate,
  hasAudio: info.hasAudio,
  fileSizeMB: (info.fileSize / 1024 / 1024).toFixed(1),
};
```

### 2. Analyze Structure
```typescript
// Calculate optimal clip parameters
const analysis = {
  // Recommended clip count based on duration
  recommendedClips: Math.min(10, Math.max(3, Math.floor(info.duration / 30))),
  
  // Duration distribution
  avgClipDuration: Math.min(60, Math.max(15, info.duration / 10)),
  
  // Aspect ratio conversion needed
  needsCrop: info.width / info.height > 0.5625, // wider than 9:16
  
  // Quality assessment
  qualityScore: calculateQualityScore(info),
  
  // Processing complexity
  estimatedRenderTime: info.duration * 3, // seconds
};
```

### 3. Scene Detection (if available)
```typescript
// Use FFprobe scene detection
const scenes = await detectScenes(videoPath);
// Returns array of { timestamp, score } for scene boundaries
```

### 4. Audio Analysis
```typescript
if (info.hasAudio) {
  const audioAnalysis = await analyzeAudio(videoPath);
  // loudness, silence detection, music/speech classification
}
```

### 5. Generate Analysis Report
```typescript
return {
  videoId,
  technical: metrics,
  analysis,
  scenes: scenes || [],
  audio: audioAnalysis || null,
  clippingRecommendation: {
    viable: metrics.duration >= 30,
    reason: metrics.duration < 30 ? 'Video too short for multiple clips' : 'Good candidate',
    suggestedClips: analysis.recommendedClips,
    targetDuration: 60,
    aspectRatio: '9:16',
  },
};
```

## Output

- Technical metadata
- Scene boundaries (if detected)
- Audio characteristics
- Clipping viability assessment
- Recommended parameters

## Quality Score Calculation

```typescript
function calculateQualityScore(info) {
  let score = 0.5;
  
  // Resolution bonus
  if (info.width >= 1920 && info.height >= 1080) score += 0.2;
  else if (info.width >= 1280 && info.height >= 720) score += 0.1;
  
  // Bitrate bonus
  if (info.videoBitrate > 5000000) score += 0.1;
  else if (info.videoBitrate > 2000000) score += 0.05;
  
  // Codec bonus
  if (['h264', 'libx264', 'hevc'].includes(info.videoCodec.toLowerCase())) score += 0.1;
  
  // Audio presence
  if (info.hasAudio) score += 0.1;
  
  return Math.min(1, score);
}
```

## Integration with Full Pipeline

This analysis feeds into:
- `find-highlights.md` - Scene boundaries help segment transcript
- `create-clips.md` - Quality score affects viral scoring
- `quality-control.md` - Baseline for comparison