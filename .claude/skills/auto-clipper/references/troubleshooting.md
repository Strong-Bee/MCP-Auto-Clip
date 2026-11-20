# Troubleshooting Guide

Common issues and solutions for Auto Clipper workflows.

## MCP Server Issues

### Server Won't Start

**Symptoms:** Process exits immediately, "MCP Server failed to start"

**Causes & Fixes:**
| Cause | Fix |
|-------|-----|
| Port in use | Check `PORT` env var, kill existing process |
| Database locked | Delete `data/autoclipper.sqlite-wal` and `-shm` files |
| Missing dependencies | Run `npm install` |
| TypeScript errors | Run `npm run build`, fix errors |
| Config validation failed | Check `.env` file, validate all required vars |

### Tools Not Available

**Symptoms:** "Unknown tool" errors, empty tool list

**Fixes:**
1. Verify server started successfully (check logs)
2. Check MCP client configuration
3. Restart MCP client after server restart
4. Verify `server.setRequestHandler(ListToolsRequestSchema)` registered

## Database Issues

### Migration Failures

**Symptoms:** "Migration failed", table errors

**Fixes:**
```bash
# Reset database
rm data/autoclipper.sqlite*
npm run build
node build/migrate.js
```

### Repository Errors

**Symptoms:** "Database not initialized", proxy errors

**Fixes:**
- Ensure `initializeDatabase()` called before any repository use
- Check lazy initialization proxies in `repositories.ts`
- Verify `getDatabase()` returns valid instance

## FFmpeg Issues

### FFmpeg Not Found

**Symptoms:** "FFmpeg not found", "Command failed"

**Fixes:**
```bash
# Windows
# Install via chocolatey: choco install ffmpeg
# Or download from ffmpeg.org, add to PATH

# Linux/Mac
sudo apt install ffmpeg  # Ubuntu/Debian
brew install ffmpeg      # macOS
```

### FFprobe Fails

**Symptoms:** "FFprobe failed", "Failed to parse output"

**Fixes:**
- Verify file exists and is readable
- Check file isn't corrupted: `ffprobe -v error input.mp4`
- Ensure FFmpeg/FFprobe versions match

### Render Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid filter" | Syntax error in filter chain | Check filter string, escape paths |
| "Output file empty" | Disk full, permission denied | Check disk space, permissions |
| "Encoder not found" | Missing libx264 | Install ffmpeg with libx264 |
| "Height not divisible by 2" | Odd dimensions | Scale filter ensures even dims |
| "Subtitle file not found" | Path error | Use absolute paths, escape special chars |

## AI Provider Issues

### OpenAI Errors

| Error | Fix |
|-------|-----|
| "Invalid API key" | Check `OPENAI_API_KEY` in `.env` |
| "Rate limit" | Add delay, reduce concurrency |
| "Model not found" | Verify `OPENAI_MODEL` (use `gpt-4o`) |
| "Context length" | Reduce transcript segments sent |

### Anthropic Errors

| Error | Fix |
|-------|-----|
| "Invalid API key" | Check `ANTHROPIC_API_KEY` |
| "Model not found" | Use `claude-3-5-sonnet-20241022` |
| "Overloaded" | Retry with backoff |

### Google Errors

| Error | Fix |
|-------|-----|
| "Invalid API key" | Check `GOOGLE_API_KEY` |
| "Quota exceeded" | Check Google Cloud Console |
| "Model not found" | Use `gemini-1.5-pro` |

### All Providers Fail

**Fallback:** System uses heuristic-based detection (keyword matching)
- Check logs for "Falling back to heuristic-based detection"
- Configure at least one provider for best results

## Queue Issues

### Jobs Stuck in Queue

**Symptoms:** Jobs stay "queued", never process

**Fixes:**
1. Check worker is running: `node build/index.js worker`
2. Verify queue initialized: logs show "Queue initialized"
3. Check `registerJobProcessor` called for job type
4. Restart worker process

### Redis Connection Failed

**Symptoms:** "Failed to initialize Redis queue, falling back to memory"

**Fixes:**
- Set `REDIS_ENABLED=false` in `.env` to use memory queue
- Or install/start Redis: `docker run -d -p 6379:6379 redis`

## Quality Control Failures

### Clips Fail QC

**Common Reasons:**
| Check | Failure Reason | Fix |
|-------|---------------|-----|
| Aspect Ratio | Input not 9:16, crop failed | Verify filter chain, check input dims |
| Duration | Render shorter/longer than planned | Check `-ss` and `-t` accuracy |
| Bitrate | Too low | Increase `VIDEO_BITRATE`, lower CRF |
| Audio Missing | Input had no audio, or `-an` used | Verify input has audio, check render args |
| Codec | Not H.264/AAC | Force `-c:v libx264 -c:a aac` |

### Retry Logic Not Working

**Fixes:**
- Check `maxRetryAttempts` in config (default 2)
- Verify `autoFixIssues` returns fixed path
- Ensure job status updates to "retrying"

## File System Issues

### Permission Denied

**Fixes:**
- Run with appropriate permissions
- Check `ALLOWED_PATHS` in config includes working directories
- Verify `FilesystemGuard` allows the path

### Disk Space

**Monitor:** `df -h` (Linux/Mac) or check drive in Windows
**Cleanup:** Clear `temp/`, `output/` old files

## Performance Issues

### Slow Processing

**Optimizations:**
1. Reduce `maxClips` per job
2. Use `preset: 'fast'` or `'veryfast'`
3. Lower `VIDEO_BITRATE`
4. Run fewer concurrent workers
5. Use SSD for temp/output directories

### High Memory Usage

**Fixes:**
- Process clips sequentially (not parallel)
- Clear transcription segments after use
- Limit `maxClips` to 5-8

## Debugging Tips

### Enable Debug Logging

```bash
LOG_LEVEL=debug node build/index.js worker
```

### Check Job Details

```typescript
const job = await jobRepository.findById(jobId);
console.log(job.config);
console.log(job.progress);
console.log(job.error);
```

### Inspect Database

```bash
# Using sqlite3 CLI
sqlite3 data/autoclipper.sqlite ".tables"
sqlite3 data/autoclipper.sqlite "SELECT * FROM jobs;"
```

### Test Individual Components

```bash
# Test FFmpeg
ffmpeg -version
ffprobe -version

# Test video info
node -e "require('./build/video/ffmpeg').getVideoInfo('test.mp4').then(console.log)"

# Test transcription
node -e "require('./build/ai/transcription').transcribeAudio('audio.wav', {}).then(console.log)"
```

## Error Code Reference

| Code | Component | Meaning |
|------|-----------|---------|
| `DB_NOT_INIT` | Database | Call initializeDatabase() first |
| `INVALID_SOURCE` | Ingestion | Video file not accessible |
| `NO_AI_PROVIDER` | AI | No API keys configured |
| `TRANSCRIPTION_FAILED` | AI | All providers failed |
| `NO_HIGHLIGHTS` | Highlights | No segments met criteria |
| `RENDER_FAILED` | FFmpeg | Video rendering error |
| `QUALITY_FAILED` | QC | Clip didn't meet thresholds |
| `QUEUE_FULL` | Queue | Too many concurrent jobs |
| `FS_ACCESS_DENIED` | Security | Path not in allowed list |
| `URL_BLOCKED` | Security | Domain/IP blocked |
| `RATE_LIMITED` | Security | Tool call rate exceeded |

## Getting Help

1. Check logs with `LOG_LEVEL=debug`
2. Verify all `.env` variables set
3. Test each component independently
4. Check GitHub issues for known bugs
5. Ensure FFmpeg, Node.js versions compatible