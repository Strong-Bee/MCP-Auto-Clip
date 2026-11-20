# Workflow: Quality Control

Validate rendered clips meet quality standards with auto-correction capability.

## Purpose

Ensure every output clip is technically sound and visually correct before delivery.

## Quality Checks (9 Checks)

### 1. File Existence
```typescript
if (!fs.existsSync(clip.outputPath)) {
  return { passed: false, severity: 'critical', issue: 'Output file not found' };
}
```

### 2. Video Readable (FFprobe)
```typescript
const info = await getVideoInfo(clip.outputPath);
if (!info.hasVideo) {
  return { passed: false, severity: 'critical', issue: 'No video stream in output' };
}
```

### 3. Duration Accuracy
```typescript
const durationDiff = Math.abs(info.duration - clip.duration);
if (durationDiff > 2) {
  severity = durationDiff > 5 ? 'high' : 'medium';
  return { passed: false, severity, issue: `Duration mismatch: expected ${clip.duration}s, got ${info.duration}s` };
}
```

### 4. Resolution & Aspect Ratio (9:16)
```typescript
const expectedAspect = 1080 / 1920; // 0.5625
const actualAspect = info.width / info.height;
if (Math.abs(actualAspect - expectedAspect) > 0.02) {
  return { passed: false, severity: 'high', issue: `Wrong aspect ratio: ${info.width}x${info.height}` };
}

if (info.width < 720 || info.height < 1280) {
  return { passed: false, severity: 'medium', issue: `Resolution below minimum: ${info.width}x${info.height}` };
}
```

### 5. Video Bitrate
```typescript
const minBitrate = parseBitrate(config.videoBitrate) * 0.5;
if (info.videoBitrate > 0 && info.videoBitrate < minBitrate) {
  return { passed: false, severity: 'medium', issue: `Low bitrate: ${formatBitrate(info.videoBitrate)}` };
}
```

### 6. Audio Presence & Quality
```typescript
if (!info.hasAudio) {
  return { passed: false, severity: 'high', issue: 'No audio track' };
}
if (info.audioBitrate > 0 && info.audioBitrate < 64000) {
  return { passed: false, severity: 'low', issue: `Low audio bitrate: ${formatBitrate(info.audioBitrate)}` };
}
```

### 7. File Size
```typescript
const sizeMB = info.fileSize / (1024 * 1024);
if (sizeMB > 100) {
  return { passed: false, severity: 'medium', issue: `File too large: ${sizeMB.toFixed(1)}MB` };
}
```

### 8. Codec Compatibility
```typescript
const preferredVideo = ['h264', 'libx264'];
const preferredAudio = ['aac', 'mp3'];

if (!preferredVideo.some(c => info.videoCodec.toLowerCase().includes(c))) {
  return { passed: false, severity: 'low', issue: `Non-standard video codec: ${info.videoCodec}` };
}
```

### 9. Frame Rate
```typescript
if (info.fps < 24 || info.fps > 60) {
  return { passed: false, severity: 'low', issue: `Unusual frame rate: ${info.fps.toFixed(1)} fps` };
}
```

### 10. Subtitle Sync (if applicable)
```typescript
if (clip.subtitlePath && fs.existsSync(clip.subtitlePath)) {
  const syncOffset = await checkSubtitleSync(clip.subtitlePath, info.duration);
  if (Math.abs(syncOffset) > 1) {
    severity = Math.abs(syncOffset) > 3 ? 'high' : 'medium';
    return { passed: false, severity, issue: `Subtitle sync offset: ${syncOffset > 0 ? '+' : ''}${syncOffset.toFixed(1)}s` };
  }
}
```

## Quality Score Calculation

```typescript
let score = 1.0;
score -= criticalIssues * 0.5;
score -= highIssues * 0.2;
score -= mediumIssues * 0.1;
score -= lowIssues * 0.05;
score = Math.max(0, score);

const passed = criticalIssues === 0 && highIssues === 0 && score >= config.qualityThreshold;
```

## Auto-Correction

For auto-fixable issues (max 2 attempts):

| Issue | Correction |
|-------|------------|
| Duration mismatch | Re-render with adjusted `-t` parameter |
| Wrong aspect ratio | Verify filter chain, re-render |
| Low bitrate | Increase `-b:v` or lower `-crf` |
| Low audio bitrate | Increase `-b:a` |
| Large file size | Increase `-crf`, lower bitrate |
| Wrong codec | Force `-c:v libx264 -c:a aac` |
| Frame rate | Add `-r 30` filter |
| Subtitle sync | Regenerate subtitles with offset |

## Retry Logic

```typescript
async function processWithQC(clip, jobConfig, attempt = 1) {
  const qcResult = await qualityCheck(clip.outputPath, clip);
  
  if (qcResult.passed) return { success: true, qcResult };
  
  if (attempt <= jobConfig.maxRetryAttempts && qcResult.issues.some(i => i.autoFixable)) {
    console.log(`QC failed, attempting auto-fix (attempt ${attempt}/${jobConfig.maxRetryAttempts})`);
    
    // Apply fixes and re-render
    const fixed = await autoFixIssues(clip.outputPath, qcResult.issues, clip);
    if (fixed) {
      return processWithQC(clip, jobConfig, attempt + 1);
    }
  }
  
  return { success: false, qcResult };
}
```

## Output

`QualityCheckResult`:
```typescript
{
  id: string,
  clipId: string,
  passed: boolean,
  score: number,        // 0-1
  issues: QualityIssue[],
  metrics: {
    videoBitrate: number,
    audioBitrate: number,
    resolution: { width, height },
    aspectRatio: string,
    duration: number,
    subtitleSyncOffset: number,
    audioLoudness: number,      // LUFS
    videoQualityScore: number,  // 0-1
  },
}
```

## Quality Thresholds

| Metric | Minimum | Target |
|--------|---------|--------|
| Overall Score | 0.7 | 0.9 |
| Resolution | 720x1280 | 1080x1920 |
| Aspect Ratio | ±2% of 9:16 | Exact 9:16 |
| Video Bitrate | 1M | 2M |
| Audio Bitrate | 64k | 128k |
| Duration Accuracy | ±2s | ±0.5s |
| Subtitle Sync | ±1s | ±0.2s |
| File Size | <100MB | <50MB |

## Integration

Called after each clip render in the main worker pipeline. Failed clips are retried up to `maxRetryAttempts` (default 2) before being marked as failed in the job result.