---
name: auto-clipper
description: Automatically analyze long-form videos, identify engaging moments, create vertical short-form clips, generate subtitles and social media metadata, render videos, and validate output using MCP Auto Clip.
---

# Auto Clipper Agent Skill

This skill enables autonomous video clipping workflows using the MCP Auto Clip server. It provides a complete pipeline from video ingestion to viral-ready short-form clips.

## When to Use This Skill

Use this skill when you need to:
- Process long-form videos into short-form vertical clips (9:16)
- Automatically identify engaging highlights from video content
- Generate burned-in subtitles with proper styling
- Create viral-optimized metadata (titles, descriptions, hashtags)
- Perform quality control with auto-correction
- Batch process multiple videos

## Prerequisites

1. **MCP Auto Clip Server** must be running and accessible
2. **At least one AI provider** configured (OpenAI, Anthropic, or Google)
3. **FFmpeg** installed natively on the system
4. **Video files** accessible within allowed filesystem paths

## MCP Tools Reference

The following MCP tools are available from the Auto Clipper server:

| Tool | Description |
|------|-------------|
| `process_video` | Ingest video and start full processing pipeline |
| `get_job_status` | Check job progress and status |
| `cancel_job` | Cancel a queued or processing job |
| `retry_job` | Retry a failed job |
| `list_videos` | List processed videos |
| `get_video_info` | Get technical video metadata via FFprobe |
| `get_queue_stats` | Get job queue statistics |
| `get_settings` | Get application settings |
| `update_setting` | Update a setting |

## Workflow: Full Auto Clipping

### 1. Import and Validate Video

```typescript
// Check if video is accessible
const info = await mcp.call('get_video_info', { videoPath: '/path/to/video.mp4' });

// Start processing
const result = await mcp.call('process_video', {
  inputPath: '/path/to/video.mp4',
  config: {
    targetDuration: 60,
    maxClips: 10,
    minClipDuration: 15,
    maxClipDuration: 120,
    aspectRatio: '9:16',
    qualityThreshold: 0.7,
    enableViralScoring: true,
    customPrompt: 'Focus on emotional storytelling moments with strong visual hooks'
  }
});
```

### 2. Monitor Job Progress

```typescript
// Poll for status
const status = await mcp.call('get_job_status', { jobId: result.jobId });

// Wait for completion
while (status.status === 'queued' || status.status === 'processing') {
  await sleep(5000);
  status = await mcp.call('get_job_status', { jobId: result.jobId });
}

if (status.status === 'completed') {
  // Job complete, results available
}
```

### 3. Retrieve Results

```typescript
// Get job details with clips
const job = await mcp.call('get_job_status', { jobId: result.jobId });
// job.details.result contains clips array with output paths
```

## Autonomous Decision Making

The agent can automatically decide:

- **Best moments**: Score highlights by viral potential (hook 25%, information 20%, emotion 15%, context 15%, storytelling 15%, quality 10%)
- **Clip duration**: 15-120 seconds, optimized for platform
- **Start/end points**: Align to sentence boundaries for clean cuts
- **Crop position**: Center on active speaker/face detection
- **Subtitle style**: High contrast, bottom position, 50px margin
- **AI provider**: Priority order - OpenAI > Anthropic > Google
- **Retry logic**: Max 2 attempts per clip on quality failure

## Default Configuration

```json
{
  "mode": "fully-automatic",
  "aspectRatio": "9:16",
  "resolution": "1080x1920",
  "format": "mp4",
  "videoCodec": "libx264",
  "audioCodec": "aac",
  "subtitleMode": "burn-in",
  "generateMetadata": true,
  "generateViralScore": true,
  "qualityControl": true,
  "maxCorrectionAttempts": 2,
  "requireApprovalBeforePublishing": true
}
```

## Quality Control Checklist

Before marking a clip complete, verify:

- [ ] File exists and is readable
- [ ] FFprobe validates video stream
- [ ] Resolution 1080x1920 (9:16)
- [ ] Aspect ratio correct
- [ ] Duration matches plan (±2s tolerance)
- [ ] Audio track present and playable
- [ ] Subtitles in sync (±1s tolerance)
- [ ] No unintentional black/freeze frames
- [ ] Crop preserves main subject
- [ ] Start/end not semantically truncated
- [ ] Metadata saved to database

## Error Handling & Retry

If quality check fails:
1. Log specific failure reasons
2. Attempt auto-fix (re-render with adjusted params)
3. Retry up to 2 times
4. If still failing, mark for manual review

## Slash Commands (Claude Code)

```
/auto-clipper                           # Show help
/auto-clipper import <video>            # Import and validate video
/auto-clipper analyze <video>           # Analyze video for highlights
/auto-clipper find-highlights <video>   # Detect highlight segments
/auto-clipper create-clips <video>      # Generate clips from video
/auto-clipper batch <folder>            # Batch process folder
/auto-clipper quality-check <clip>      # Run quality check on clip
```

## Workflows

See `workflows/` directory for detailed workflow instructions:
- `auto-clip.md` - Complete automated pipeline
- `import-video.md` - Video ingestion and validation
- `analyze-video.md` - Technical analysis with FFprobe
- `find-highlights.md` - AI-powered highlight detection
- `create-clips.md` - Clip planning and rendering
- `subtitle-generation.md` - Subtitle creation and burning
- `generate-metadata.md` - Viral metadata generation
- `quality-control.md` - QC and auto-correction
- `batch-processing.md` - Multiple video processing

## Strategies

See `strategies/` for content-type specific approaches:
- `podcast.md` - Conversation-based content
- `interview.md` - Q&A format optimization
- `educational.md` - Tutorial/lesson structure
- `storytelling.md` - Narrative arc preservation
- `gaming.md` - High-action moment detection
- `entertainment.md` - Comedy/reaction optimization

## References

See `references/` for technical details:
- `mcp-tools.md` - Complete tool specifications
- `video-formats.md` - Supported formats and codecs
- `subtitle-guidelines.md` - Styling and sync standards
- `highlight-scoring.md` - Scoring algorithm details
- `troubleshooting.md` - Common issues and fixes

## Templates

See `templates/` for JSON schemas:
- `clip-plan.json` - Clip specification format
- `clip-metadata.json` - Metadata output format
- `quality-report.json` - QC result format

## Installation

1. Ensure MCP Auto Clip is installed and configured
2. Add this skill to your agent's skill directory:
   - **Claude Code**: `.claude/skills/auto-clipper/SKILL.md`
   - **OpenCode**: `.opencode/skill/auto-clipper/SKILL.md`
3. Configure MCP server in your agent's MCP settings
4. Set required environment variables (API keys)

## Security

- All file operations restricted to configured allowed paths
- URL imports validated against allowlist/blocklist
- API keys managed through secure key guard
- Tool calls rate-limited and parameter-validated
- No external publishing without explicit approval