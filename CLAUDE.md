# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run built application
npm start

# Run in development mode (ts-node)
npm run dev
```

## Architecture

**MCP Auto Clip** - Minimal TypeScript project structure:

- `src/index.ts` - Entry point (currently placeholder)
- `build/` - Compiled output (gitignored)
- `package.json` - npm config with TypeScript, ts-node, @types/node
- `tsconfig.json` - ES2020 target, commonjs modules, strict mode

## Current State

Project is scaffolded but not implemented. The `src/index.ts` only contains placeholder `console.log` statements with a TODO comment for the actual auto clip functionality.

## Next Steps

When implementing the auto clip feature, clarify:
- Input source (video, audio, text, stream?)
- Clipping criteria (time-based, content-based, silence detection?)
- Output format and destination
- Any MCP server integration requirements