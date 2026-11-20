# AGENTS.md - Agent Integration Guide

This document describes how to integrate and use the Auto Clipper agent skill with various AI agents.

## Supported Agents

### Claude Code

The skill is installed at `.claude/skills/auto-clipper/SKILL.md`

#### Activation
The skill loads automatically when you reference it or use its slash commands.

#### Slash Commands
```
/auto-clipper                    # Show help
/auto-clipper import <video>     # Import and validate video
/auto-clipper analyze <video>    # Analyze video for highlights
/auto-clipper find-highlights <video>  # Detect highlights
/auto-clipper create-clips <video>     # Generate clips
/auto-clipper batch <folder>     # Batch process
/auto-clipper quality-check <clip>     # Run QC
```

#### Natural Language Usage
```
"Process the video at ./podcast.mp4 into viral TikTok clips"
"Analyze ./interview.mp4 and find the best 30-second segments"
"Batch process all videos in ./raw-footage/ for Reels"
```

### OpenCode

The skill is installed at `.opencode/skill/auto-clipper/SKILL.md`

#### Activation
Configure in your OpenCode settings to load the skill directory.

#### Usage
Same slash commands and natural language patterns as Claude Code.

## MCP Server Configuration

### Claude Code MCP Settings

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "auto-clipper": {
      "command": "node",
      "args": ["build/index.js", "mcp"],
      "cwd": "/path/to/mcp-auto-clipper"
    }
  }
}
```

### OpenCode MCP Settings

Configure similarly in OpenCode's MCP settings.

## Required Environment Variables

The MCP server requires these environment variables (set in `.env`):

```env
# At least one required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
NVIDIA_API_KEY=...

# Optional
REDIS_ENABLED=false
```

## Agent Workflow Examples

### Example 1: Podcast to TikTok

**User:** "Turn my podcast episode into TikTok clips"

**Agent:**
1. Calls `process_video` with podcast strategy config
2. Monitors job via `get_job_status`
3. Returns clip paths and metadata

### Example 2: Analyze Before Clipping

**User:** "What are the best moments in this video?"

**Agent:**
1. Calls `get_video_info` for technical details
2. Calls `process_video` with `customPrompt` for analysis only
3. Returns highlight analysis without rendering

### Example 3: Batch Processing

**User:** "Process all videos in ./footage for YouTube Shorts"

**Agent:**
1. Discovers video files
2. Queues multiple `process_video` jobs
3. Monitors all jobs
4. Returns aggregate report

## Tool Calling Patterns

### Sequential Processing
```typescript
// 1. Validate
const info = await mcp.get_video_info({ videoPath });

// 2. Process
const job = await mcp.process_video({ inputPath: videoPath, config });

// 3. Monitor
let status = await mcp.get_job_status({ jobId: job.jobId });
while (status.status === 'processing') {
  await sleep(5000);
  status = await mcp.get_job_status({ jobId: job.jobId });
}

// 4. Return results
return status.details.result;
```

### Parallel Batch
```typescript
const jobIds = await Promise.all(
  videoPaths.map(p => mcp.process_video({ inputPath: p, config }))
);

// Monitor all
const results = await Promise.all(
  jobIds.map(j => monitorJob(j.jobId))
);
```

## Error Handling for Agents

### Recoverable Errors (Auto-Retry)
- `TRANSCRIPTION_FAILED` - Try next provider
- `RENDER_FAILED` - Retry with faster preset
- `QUALITY_FAILED` - Auto-fix and re-render (max 2x)

### Non-Recoverable (Require User Action)
- `INVALID_SOURCE` - Fix file path/permissions
- `NO_AI_PROVIDER` - Add API key
- `FS_ACCESS_DENIED` - Adjust allowed paths
- `URL_BLOCKED` - Use local file instead

### Agent Response Pattern
```typescript
try {
  const result = await mcp.process_video({...});
  return { success: true, ...result };
} catch (error) {
  if (error.recoverable) {
    // Agent can retry automatically
    return { success: false, recoverable: true, ... };
  } else {
    // Requires user intervention
    return { success: false, recoverable: false, userAction: error.message };
  }
}
```

## Skill Customization

### Adding Custom Strategies
Create new strategy files in `skills/auto-clipper/strategies/`:
```markdown
# Strategy: Your Content Type
## Highlight Detection Tuning
## Clip Planning
## Metadata Strategy
```

### Modifying Default Config
Update `defaultConfig` in `SKILL.md` or override via job config:
```json
{
  "customPrompt": "Your specific instructions",
  "targetPlatform": "reels",
  "metadataStyle": "educational"
}
```

## Testing Integration

### Verify MCP Connection
```bash
# In agent terminal
/auto-clipper --help
# Should show skill commands
```

### Test Video Processing
```bash
# Via MCP
mcp.call('process_video', { inputPath: 'test.mp4' })

# Via CLI
node build/index.js worker &
node build/index.js mcp &
```

## Troubleshooting Agent Integration

| Issue | Solution |
|-------|----------|
| Skill not loading | Check `.claude/skills/auto-clipper/SKILL.md` exists |
| Tools not found | Restart agent after MCP server starts |
| Permission errors | Verify `ALLOWED_PATHS` includes video directories |
| API key errors | Check `.env` has valid keys, restart server |
| Timeout | Increase MCP tool timeout in agent settings |

## Security Notes for Agents

- Never expose API keys in agent responses
- Validate all file paths through `FilesystemGuard`
- Don't auto-publish to social platforms
- Respect `requireApprovalBeforePublishing: true`
- Rate limit tool calls (handled by `MCPToolGuard`)