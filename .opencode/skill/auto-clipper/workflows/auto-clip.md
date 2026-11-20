# Workflow: Full Auto Clipping Pipeline

Complete end-to-end workflow for processing a long-form video into viral short-form clips.

## Input

- Video file path (local, within allowed directories)
- Optional configuration overrides

## Steps

### 1. Validate Source
```typescript
const validation = await mcp.call('get_video_info', { videoPath: inputPath });
if (!validation.hasVideo) throw new Error('No video stream found');
```

### 2. Ingest & Queue Job
```typescript
const result = await mcp.call('process_video', {
  inputPath,
  config: {
    targetDuration: 60,
    maxClips: 10,
    minClipDuration: 15,
    maxClipDuration: 120,
    aspectRatio: '9:16',
    qualityThreshold: 0.7,
    enableViralScoring: true,
    customPrompt: 'Focus on high-engagement moments with strong hooks'
  }
});
```

### 3. Monitor Progress
```typescript
let status = await mcp.call('get_job_status', { jobId: result.jobId });
while (status.status === 'queued' || status.status === 'processing') {
  await sleep(5000);
  status = await mcp.call('get_job_status', { jobId: result.jobId });
  
  // Log progress
  console.log(`Step: ${status.details?.progress?.currentStep}, Progress: ${status.progress}%`);
}
```

### 4. Handle Completion
```typescript
if (status.status === 'completed') {
  const clips = status.details?.result?.clips || [];
  
  // Verify each clip
  for (const clip of clips) {
    const qc = await mcp.call('get_video_info', { videoPath: clip.outputPath });
    // Run quality checks...
  }
  
  return { success: true, clips, jobId: result.jobId };
}
```

### 5. Handle Failure
```typescript
if (status.status === 'failed') {
  const error = status.details?.error;
  
  // Attempt retry if recoverable
  if (error?.recoverable) {
    await mcp.call('retry_job', { jobId: result.jobId });
    // Re-monitor...
  }
  
  return { success: false, error: error?.message };
}
```

## Output

- Array of clip objects with:
  - `outputPath`: Path to rendered video
  - `duration`: Clip duration
  - `viralScore`: Predicted viral potential (0-1)
  - `metadata`: Title, description, hashtags, engagement prediction
  - `qualityCheck`: Pass/fail with details

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `INVALID_SOURCE` | Video file not accessible | Check path and permissions |
| `NO_AI_PROVIDER` | No AI API keys configured | Add at least one provider key |
| `TRANSCRIPTION_FAILED` | All transcription providers failed | Check API keys, try local fallback |
| `RENDER_FAILED` | FFmpeg rendering error | Check FFmpeg install, disk space |
| `QUALITY_FAILED` | Clip failed QC after retries | Manual review needed |

## Retry Logic

- Max 2 retries per clip on quality failure
- Exponential backoff: 5s, 10s between attempts
- Re-render with adjusted parameters on each retry