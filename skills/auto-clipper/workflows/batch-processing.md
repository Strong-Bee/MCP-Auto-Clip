# Workflow: Batch Processing

Process multiple videos in sequence or parallel with queue management.

## Purpose

Efficiently process a folder of videos or a list of video paths through the full Auto Clipper pipeline.

## Input

- Directory path or array of video paths
- Shared configuration (or per-video overrides)
- Concurrency limit (default: 1 for sequential, max 3)

## Steps

### 1. Discover Videos
```typescript
async function discoverVideos(input: string | string[]): Promise<string[]> {
  const paths = Array.isArray(input) ? input : [input];
  const videos: string[] = [];
  
  for (const p of paths) {
    const stat = await fs.promises.stat(p);
    if (stat.isDirectory()) {
      const files = await fs.promises.readdir(p);
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (config.allowedVideoExtensions.includes(ext)) {
          videos.push(path.join(p, file));
        }
      }
    } else if (stat.isFile()) {
      const ext = path.extname(p).toLowerCase();
      if (config.allowedVideoExtensions.includes(ext)) {
        videos.push(p);
      }
    }
  }
  
  return videos;
}
```

### 2. Validate All Videos
```typescript
const validVideos = [];
for (const videoPath of videos) {
  const validation = validateVideoFile(videoPath);
  if (validation.valid) {
    validVideos.push(videoPath);
  } else {
    console.warn(`Skipping ${videoPath}: ${validation.error}`);
  }
}
```

### 3. Queue Jobs with Staggered Starts
```typescript
const jobIds = [];
for (let i = 0; i < validVideos.length; i++) {
  const videoPath = validVideos[i];
  const delay = i * 10000; // 10 second stagger to avoid resource contention
  
  const jobId = await addJob('process_video', {
    inputPath: videoPath,
    outputDir: config.outputPath,
    config: batchConfig,
  }, { delay, priority: -i }); // Earlier videos get higher priority
  
  jobIds.push({ videoPath, jobId });
}
```

### 4. Monitor All Jobs
```typescript
async function monitorBatch(jobIds: string[]): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  const pending = new Set(jobIds);
  
  while (pending.size > 0) {
    for (const jobId of [...pending]) {
      const status = await getJobStatus(jobId);
      
      if (status.status === 'completed') {
        pending.delete(jobId);
        const job = await jobRepository.findById(jobId);
        results.push({ jobId, videoPath: job.inputPath, status: 'completed', clips: job.result?.clips });
      } else if (status.status === 'failed') {
        pending.delete(jobId);
        const job = await jobRepository.findById(jobId);
        results.push({ jobId, videoPath: job.inputPath, status: 'failed', error: job.error });
      }
    }
    
    if (pending.size > 0) {
      await sleep(5000);
    }
  }
  
  return results;
}
```

### 5. Generate Batch Report
```typescript
function generateBatchReport(results: BatchResult[]): BatchReport {
  const completed = results.filter(r => r.status === 'completed');
  const failed = results.filter(r => r.status === 'failed');
  const totalClips = completed.reduce((sum, r) => sum + (r.clips?.length || 0), 0);
  
  return {
    timestamp: new Date().toISOString(),
    totalVideos: results.length,
    completed: completed.length,
    failed: failed.length,
    totalClips,
    avgClipsPerVideo: completed.length > 0 ? totalClips / completed.length : 0,
    results,
  };
}
```

## Configuration

```typescript
interface BatchConfig {
  concurrency: 1 | 2 | 3;           // Parallel jobs
  staggerDelay: number;              // Ms between job starts
  sharedConfig: JobConfig;           // Applied to all videos
  perVideoConfig?: Map<string, JobConfig>; // Overrides
  continueOnFailure: boolean;        // Don't stop on errors
  outputDir: string;                 // Base output directory
}
```

## Resource Management

- Limit concurrent FFmpeg processes (max 2-3)
- Stagger job starts to avoid I/O contention
- Monitor disk space during batch
- Clean temp files between videos

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Single video fails | Log error, continue with `continueOnFailure=true` |
| Disk full | Pause queue, alert, resume when space freed |
| API rate limit | Back off, retry with exponential delay |
| FFmpeg crash | Retry video once, then mark failed |

## Output

- Individual clip outputs per video
- Batch summary report (JSON)
- Failed videos list for retry
- Aggregate statistics

## CLI Usage

```bash
# Process folder
/auto-clipper batch ./videos --concurrency 2 --target-duration 60

# Process list
/auto-clipper batch video1.mp4 video2.mp4 video3.mp4

# With custom config
/auto-clipper batch ./videos --config '{"maxClips": 5, "platform": "reels"}'
```