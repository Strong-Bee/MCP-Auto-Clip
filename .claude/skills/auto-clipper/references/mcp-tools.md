# MCP Tools Reference

Complete specification of all MCP tools available in Auto Clipper.

## Tools

### process_video
Start full video processing pipeline.

**Input:**
```json
{
  "inputPath": "string (required)",
  "outputDir": "string (optional)",
  "config": {
    "targetDuration": "number (5-300, default 60)",
    "maxClips": "number (1-50, default 10)",
    "minClipDuration": "number (5-60, default 15)",
    "maxClipDuration": "number (10-300, default 120)",
    "aspectRatio": "enum ['9:16', '16:9', '1:1'] (default '9:16')",
    "language": "string (optional)",
    "qualityThreshold": "number (0-1, default 0.7)",
    "enableViralScoring": "boolean (default true)",
    "customPrompt": "string (optional, max 5000 chars)"
  }
}
```

**Output:**
```json
{
  "jobId": "uuid",
  "videoId": "uuid",
  "status": "queued",
  "message": "Video ingestion complete. Processing started."
}
```

---

### get_job_status
Get job progress and results.

**Input:**
```json
{
  "jobId": "uuid (required)"
}
```

**Output:**
```json
{
  "jobId": "uuid",
  "status": "enum ['queued', 'processing', 'completed', 'failed']",
  "progress": "number (0-100)",
  "details": {
    "type": "string",
    "inputPath": "string",
    "config": "object",
    "result": {
      "videoId": "uuid",
      "clips": [
        {
          "id": "uuid",
          "startTime": "number",
          "endTime": "number",
          "duration": "number",
          "outputPath": "string",
          "status": "enum ['pending', 'rendering', 'completed', 'failed']",
          "viralScore": "number",
          "metadata": "ClipMetadata"
        }
      ]
    },
    "error": {
      "code": "string",
      "message": "string",
      "step": "string",
      "recoverable": "boolean"
    }
  }
}
```

---

### cancel_job
Cancel a queued or processing job.

**Input:**
```json
{
  "jobId": "uuid (required)"
}
```

**Output:**
```json
{
  "success": "boolean",
  "jobId": "uuid"
}
```

---

### retry_job
Retry a failed job.

**Input:**
```json
{
  "jobId": "uuid (required)"
}
```

**Output:**
```json
{
  "success": "boolean",
  "jobId": "uuid"
}
```

---

### list_videos
List processed videos.

**Input:**
```json
{
  "limit": "number (1-100, default 50)",
  "offset": "number (default 0)"
}
```

**Output:**
```json
{
  "videos": "VideoMetadata[]",
  "total": "number",
  "limit": "number",
  "offset": "number"
}
```

---

### get_video_info
Get technical video metadata via FFprobe.

**Input:**
```json
{
  "videoPath": "string (required)"
}
```

**Output:**
```json
{
  "path": "string",
  "duration": "number",
  "width": "number",
  "height": "number",
  "fps": "number",
  "videoCodec": "string",
  "audioCodec": "string",
  "videoBitrate": "number",
  "audioBitrate": "number",
  "format": "string",
  "fileSize": "number",
  "hasAudio": "boolean",
  "hasVideo": "boolean"
}
```

---

### get_queue_stats
Get job queue statistics.

**Input:** `{}`

**Output:**
```json
{
  "waiting": "number",
  "active": "number",
  "completed": "number",
  "failed": "number"
}
```

---

### get_settings
Get application settings.

**Input:** `{}`

**Output:** `Record<string, any>`

---

### update_setting
Update a setting.

**Input:**
```json
{
  "key": "string (required)",
  "value": "string (required)"
}
```

**Output:**
```json
{
  "success": "boolean",
  "key": "string",
  "value": "string"
}
```

## Resources

| URI | Description |
|-----|-------------|
| `autoclipper://jobs/recent` | Recent jobs (last 20) |
| `autoclipper://videos/list` | All processed videos |
| `autoclipper://settings` | Current settings |
| `autoclipper://queue/stats` | Queue statistics |

## Prompts

### create_viral_clip
Generate a viral clip from a video.

**Arguments:**
- `inputPath` (required): Video file path
- `style` (optional): viral, educational, entertainment
- `platform` (optional): tiktok, reels, shorts
- `duration` (optional): Target duration in seconds

### analyze_video
Analyze video for clipping potential.

**Arguments:**
- `inputPath` (required): Video file path