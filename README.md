# MCP Auto Clipper

An intelligent, multi-provider AI video clipping system that automatically transforms long-form videos into viral-ready short-form clips (9:16 portrait) with subtitles, metadata, and quality control.

## Features

- **Multi-Provider AI**: OpenAI, Anthropic, Google with automatic fallback
- **Full Pipeline**: Ingestion → Transcription → Highlight Detection → Clip Planning → Subtitles → Rendering → Metadata → QC
- **MCP Server**: Model Context Protocol server with 9 tools, 4 resources, 2 prompts
- **Persistent Queue**: BullMQ (Redis) with in-memory fallback
- **SQLite Database**: sql.js WASM for zero-native-dependency persistence
- **Security Guardrails**: Filesystem, URL, API key, and MCP tool protection
- **Agent Skill**: Compatible with Claude Code and OpenCode
- **Quality Control**: 9 automated checks with auto-correction (max 2 retries)

## Quick Start

### Prerequisites

- Node.js 18+
- FFmpeg & FFprobe (native installation)
- At least one AI provider API key

### Installation

```bash
# Clone and install
git clone <repo>
cd mcp-auto-clipper
npm install

# Build
npm run build

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Configuration

Edit `.env` with your settings:

```env
# Required: At least one AI provider
OPENAI_API_KEY=your-key
# ANTHROPIC_API_KEY=your-key
# GOOGLE_API_KEY=your-key

# Optional: Redis for production queue
REDIS_ENABLED=false
```

### Running

```bash
# Start MCP server (for Claude Code/OpenCode)
npm run start:mcp

# Start worker (processes jobs)
npm run start:worker

# Development mode
npm run dev
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `process_video` | Full video processing pipeline |
| `get_job_status` | Check job progress |
| `cancel_job` | Cancel queued/processing job |
| `retry_job` | Retry failed job |
| `list_videos` | List processed videos |
| `get_video_info` | Technical video metadata |
| `get_queue_stats` | Queue statistics |
| `get_settings` | Get settings |
| `update_setting` | Update setting |

## Agent Skill Usage

### Claude Code

```bash
# Skill auto-loaded from .claude/skills/auto-clipper/
/auto-clipper import ./video.mp4
/auto-clipper create-clips ./video.mp4
/auto-clipper batch ./videos/
```

### OpenCode

```bash
# Skill auto-loaded from .opencode/skill/auto-clipper/
/auto-clipper import ./video.mp4
```

## Architecture

```
src/
├── config/          # Configuration & database
├── database/        # SQLite schema, migrations, repositories
├── ai/              # Transcription, highlight detection
├── video/           # FFmpeg engine, ingestion, clip planning
├── subtitle/        # SRT/ASS generation, burning
├── metadata/        # Viral metadata, scoring
├── qc/              # Quality control
├── queue/           # BullMQ job queue
├── workers/         # Job processing workers
├── mcp/             # MCP server implementation
└── security/        # Guardrails
```

## Workflows

See `skills/auto-clipper/workflows/` for detailed workflows:
- `auto-clip.md` - Complete pipeline
- `import-video.md` - Video validation
- `analyze-video.md` - Technical analysis
- `find-highlights.md` - AI highlight detection
- `create-clips.md` - Clip rendering
- `subtitle-generation.md` - Subtitles
- `generate-metadata.md` - Viral metadata
- `quality-control.md` - QC & auto-correction
- `batch-processing.md` - Multiple videos

## Strategies

Content-type optimized configurations in `skills/auto-clipper/strategies/`:
- `podcast.md`
- `interview.md`
- `educational.md`
- `storytelling.md`
- `gaming.md`
- `entertainment.md`

## Quality Standards

All output clips meet:
- ✅ 1080x1920 (9:16 portrait)
- ✅ H.264 / AAC in MP4
- ✅ Burned-in subtitles
- ✅ Duration 15-120s
- ✅ Bitrate ≥1M video, ≥64k audio
- ✅ Sync tolerance ±1s

## Security

- Filesystem access restricted to configured paths
- URL imports validated (blocklist private IPs, metadata endpoints)
- API keys managed with rotation & rate limiting
- MCP tool calls rate-limited & parameter-validated
- No external publishing without approval

## Development

```bash
# Run tests
npm test

# Lint
npm run lint

# Type check
npm run build
```

## License

MIT