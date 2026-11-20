# MCP Auto Clipper

<p align="center">
  <a href="https://trendshift.io/repositories/82054" target="_blank">
    <img src="https://trendshift.io/api/badge/repositories/82054" alt="Trendshift Repository Badge" width="250" height="55" />
  </a>
</p>

<p align="center">
  An intelligent, multi-provider AI video clipping system that automatically transforms long-form videos into viral-ready short-form clips.
</p>

<p align="center">
  <strong>Node.js · TypeScript · MCP · FFmpeg · Multi-Provider AI</strong>
</p>

---

## Overview

**MCP Auto Clipper** is an automated AI-powered video clipping system designed to transform long-form videos into engaging short-form content.

It analyzes video content, identifies interesting moments, generates clips, adds subtitles, creates viral metadata, and performs automated quality control.

Designed for integration with AI coding agents and assistants, including **Claude Code** and **OpenCode**, through the Model Context Protocol (MCP) and Agent Skills.

## Features

- **Multi-Provider AI:** OpenAI, Anthropic, and Google with automatic provider fallback.
- **Automated Video Pipeline:** Ingestion → Transcription → Highlight Detection → Clip Planning → Subtitles → Rendering → Metadata → Quality Control.
- **MCP Server:** Model Context Protocol server with 9 tools, 4 resources, and 2 prompts.
- **Persistent Job Queue:** BullMQ with Redis and in-memory fallback.
- **SQLite Database:** sql.js WASM for zero-native-dependency database persistence.
- **Security Guardrails:** Filesystem restrictions, URL validation, API key protection, and MCP tool security.
- **Agent Skills:** Compatible with Claude Code and OpenCode.
- **Automated Quality Control:** 9 validation checks with automatic correction and a maximum of 2 retries.
- **Vertical Video Output:** Optimized for TikTok, YouTube Shorts, and Instagram Reels.

## Quick Start

### Prerequisites

- Node.js 18+
- FFmpeg and FFprobe
- At least one AI provider API key
- npm

### Installation

```bash
# Clone repository
git clone https://github.com/strong-bee/mcp-auto-clip.git

# Navigate to project
cd mcp-auto-clip

# Install dependencies
npm install

# Build project
npm run build

# Create environment configuration
cp .env.example .env
```

Configure your environment variables before starting the application.

### Environment Configuration

Create or edit your `.env` file:

```env
# AI Provider Configuration
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key

# Queue Configuration
REDIS_ENABLED=false
REDIS_URL=redis://localhost:6379

# Application Configuration
NODE_ENV=development
```

At least one AI provider API key is required.

Redis is optional when using the in-memory queue fallback.

### Running

```bash
# Start MCP server
npm run start:mcp

# Start background worker
npm run start:worker

# Development mode
npm run dev
```

Run the MCP server and worker as separate processes when using the background processing architecture.

## MCP Tools

MCP Auto Clipper exposes 9 tools for video processing and system management.

| Tool | Description |
|---|---|
| `process_video` | Execute the complete automated video processing pipeline. |
| `get_job_status` | Retrieve processing job status and progress. |
| `cancel_job` | Cancel queued or processing jobs. |
| `retry_job` | Retry failed processing jobs. |
| `list_videos` | List imported and processed videos. |
| `get_video_info` | Retrieve technical video metadata. |
| `get_queue_stats` | Retrieve job queue statistics. |
| `get_settings` | Retrieve application settings. |
| `update_setting` | Update configurable application settings. |

## Agent Skill Integration

MCP Auto Clipper includes Agent Skills for AI coding agents.

### Claude Code

Skill location:

```text
.claude/skills/auto-clipper/
```

Example commands:

```text
/auto-clipper import ./video.mp4
/auto-clipper create-clips ./video.mp4
/auto-clipper batch ./videos/
```

### OpenCode

Skill location:

```text
.opencode/skill/auto-clipper/
```

Example usage:

```text
/auto-clipper import ./video.mp4
/auto-clipper create-clips ./video.mp4
/auto-clipper batch ./videos/
```

The commands above represent the intended skill interface and require the corresponding skill definitions to be installed and configured.

## Architecture

```text
mcp-auto-clip/
│
├── src/
│   ├── config/          # Configuration and database setup
│   ├── database/        # SQLite schema, migrations, repositories
│   ├── ai/              # AI providers and content analysis
│   ├── video/           # FFmpeg engine and video processing
│   ├── subtitle/        # SRT/ASS generation and subtitle rendering
│   ├── metadata/        # Titles, descriptions, hashtags, viral scoring
│   ├── qc/              # Automated quality control
│   ├── queue/           # BullMQ and in-memory queue
│   ├── workers/         # Background job processing
│   ├── mcp/             # MCP server implementation
│   └── security/        # Security guardrails
│
├── skills/
│   └── auto-clipper/
│       ├── SKILL.md
│       ├── workflows/
│       └── strategies/
│
├── .claude/
│   └── skills/
│       └── auto-clipper/
│
├── .opencode/
│   └── skill/
│       └── auto-clipper/
│
├── tests/
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Workflows

Detailed workflow documentation is available in:

```text
skills/auto-clipper/workflows/
```

| Workflow | Description |
|---|---|
| `auto-clip.md` | Complete automated clipping pipeline. |
| `import-video.md` | Video ingestion and validation. |
| `analyze-video.md` | Technical video analysis. |
| `find-highlights.md` | AI-powered highlight detection. |
| `create-clips.md` | Clip planning and rendering. |
| `subtitle-generation.md` | Automatic subtitle generation. |
| `generate-metadata.md` | Titles, descriptions, and hashtags. |
| `quality-control.md` | Quality validation and auto-correction. |
| `batch-processing.md` | Batch processing for multiple videos. |

## Content Strategies

MCP Auto Clipper supports content-specific configurations to improve highlight detection and clip generation.

Location:

```text
skills/auto-clipper/strategies/
```

Available strategies:

- `podcast.md`
- `interview.md`
- `educational.md`
- `storytelling.md`
- `gaming.md`
- `entertainment.md`

## Output Quality Standards

All generated clips are designed to meet the following technical standards:

| Specification | Target |
|---|---|
| Resolution | 1080 × 1920 |
| Aspect Ratio | 9:16 Portrait |
| Video Codec | H.264 |
| Audio Codec | AAC |
| Container | MP4 |
| Subtitles | Burned-in subtitles |
| Duration | 15–120 seconds |
| Video Bitrate | ≥ 1 Mbps |
| Audio Bitrate | ≥ 64 kbps |
| Audio/Video Sync | ±1 second |

Actual output quality depends on source material and encoding configuration.

## Security

Security is a core component of MCP Auto Clipper.

- Filesystem access restricted to configured directories.
- URL imports validated against private IP ranges and metadata endpoints.
- API keys managed through environment variables.
- Provider rate limiting and request validation.
- MCP tool calls validated against predefined schemas.
- Job execution controlled through queue management.
- External publishing requires explicit user approval.

## Development

### Run Tests

```bash
npm test
```

### Run Linter

```bash
npm run lint
```

### Type Checking and Build

```bash
npm run build
```

## Star History

<p align="center">
  <a href="https://star-history.com/#strong-bee/mcp-auto-clip&Date">
    <img src="https://api.star-history.com/svg?repos=strong-bee/mcp-auto-clip&type=Date" alt="Star History Chart" width="100%" />
  </a>
</p>

## License

This project is licensed under the **MIT License**.

---

<p align="center">
  Built for AI-powered video automation.
</p>