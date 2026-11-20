// MCP Server implementation

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config';
import { initializeDatabase, closeDatabase } from '../config/database';
import { jobRepository, videoRepository, settingsRepository } from '../database/repositories';
import { addJob, getJobStatus, cancelJob, retryJob, getQueueStats } from '../queue/jobQueue';
import { ingestVideo } from '../video/ingestion';
import { getVideoInfo } from '../video/ffmpeg';
import { filesystemGuard, urlGuard, apiKeyGuard, mcpToolGuard, validateInput, ProcessVideoInputSchema, JobStatusInputSchema, ListVideosInputSchema } from '../security/guardrails';
import { v4 as uuidv4 } from 'uuid';

// Create MCP server
const server = new Server(
  {
    name: config.mcpServerName,
    version: config.mcpServerVersion,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: 'process_video',
    description: 'Process a video file to generate viral short-form clips',
    inputSchema: {
      type: 'object',
      properties: {
        inputPath: { type: 'string', description: 'Path to the input video file' },
        outputDir: { type: 'string', description: 'Output directory for clips (optional)' },
        config: {
          type: 'object',
          properties: {
            targetDuration: { type: 'number', minimum: 5, maximum: 300, description: 'Target total duration in seconds' },
            maxClips: { type: 'number', minimum: 1, maximum: 50, description: 'Maximum number of clips to generate' },
            minClipDuration: { type: 'number', minimum: 5, maximum: 60, description: 'Minimum clip duration in seconds' },
            maxClipDuration: { type: 'number', minimum: 10, maximum: 300, description: 'Maximum clip duration in seconds' },
            aspectRatio: { type: 'string', enum: ['9:16', '16:9', '1:1'], description: 'Output aspect ratio' },
            language: { type: 'string', description: 'Language code for transcription' },
            qualityThreshold: { type: 'number', minimum: 0, maximum: 1, description: 'Quality check threshold' },
            enableViralScoring: { type: 'boolean', description: 'Enable viral scoring' },
            customPrompt: { type: 'string', description: 'Custom prompt for AI processing' },
          },
        },
      },
      required: ['inputPath'],
    },
  },
  {
    name: 'get_job_status',
    description: 'Get the status and progress of a processing job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid', description: 'Job ID to check' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'cancel_job',
    description: 'Cancel a queued or processing job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid', description: 'Job ID to cancel' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'retry_job',
    description: 'Retry a failed job',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid', description: 'Job ID to retry' },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'list_videos',
    description: 'List processed videos',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
        offset: { type: 'number', minimum: 0, default: 0 },
      },
    },
  },
  {
    name: 'get_video_info',
    description: 'Get detailed information about a video file',
    inputSchema: {
      type: 'object',
      properties: {
        videoPath: { type: 'string', description: 'Path to the video file' },
      },
      required: ['videoPath'],
    },
  },
  {
    name: 'get_queue_stats',
    description: 'Get job queue statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_settings',
    description: 'Get application settings',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_setting',
    description: 'Update a setting',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['key', 'value'],
    },
  },
];

// Resource definitions
const RESOURCES = [
  {
    uri: 'autoclipper://jobs/recent',
    name: 'Recent Jobs',
    description: 'Recently processed jobs',
    mimeType: 'application/json',
  },
  {
    uri: 'autoclipper://videos/list',
    name: 'Video Library',
    description: 'List of processed videos',
    mimeType: 'application/json',
  },
  {
    uri: 'autoclipper://settings',
    name: 'Settings',
    description: 'Current application settings',
    mimeType: 'application/json',
  },
  {
    uri: 'autoclipper://queue/stats',
    name: 'Queue Statistics',
    description: 'Current job queue statistics',
    mimeType: 'application/json',
  },
];

// Prompt definitions
const PROMPTS = [
  {
    name: 'create_viral_clip',
    description: 'Generate a viral short-form video clip from a longer video',
    arguments: [
      { name: 'inputPath', description: 'Path to the input video', required: true },
      { name: 'style', description: 'Content style (viral, educational, entertainment)', required: false },
      { name: 'platform', description: 'Target platform (tiktok, reels, shorts)', required: false },
      { name: 'duration', description: 'Target duration in seconds', required: false },
    ],
  },
  {
    name: 'analyze_video',
    description: 'Analyze a video for highlight detection and clipping potential',
    arguments: [
      { name: 'inputPath', description: 'Path to the input video', required: true },
    ],
  },
];

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Validate tool call with guardrails
  const toolValidation = mcpToolGuard.validateToolCall(name, args);
  if (!toolValidation.allowed) {
    return {
      content: [{ type: 'text', text: `Security error: ${toolValidation.error}` }],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'process_video': {
        const validation = validateInput(ProcessVideoInputSchema, args);
        if (!validation.success) {
          return { content: [{ type: 'text', text: `Invalid input: ${validation.error}` }], isError: true };
        }

        const { inputPath, outputDir, config: jobConfig } = validation.data;

        // Validate file access
        const fsValidation = filesystemGuard.validatePath(inputPath, 'read');
        if (!fsValidation.allowed) {
          return { content: [{ type: 'text', text: `Filesystem error: ${fsValidation.error}` }], isError: true };
        }

        // Validate video extension
        const extValidation = filesystemGuard.validateExtension(inputPath, config.allowedVideoExtensions);
        if (!extValidation.allowed) {
          return { content: [{ type: 'text', text: `File validation error: ${extValidation.error}` }], isError: true };
        }

        const result = await ingestVideo(inputPath, jobConfig || {});

        // Add to queue
        await addJob('process_video', {
          jobId: result.job.id,
          inputPath,
          outputDir: outputDir || config.outputPath,
          config: result.job.config,
        }, { jobId: result.job.id });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              jobId: result.job.id,
              videoId: result.video.id,
              status: 'queued',
              message: 'Video ingestion complete. Processing started.',
            }, null, 2),
          }],
        };
      }

      case 'get_job_status': {
        const validation = validateInput(JobStatusInputSchema, args);
        if (!validation.success) {
          return { content: [{ type: 'text', text: `Invalid input: ${validation.error}` }], isError: true };
        }

        const status = await getJobStatus(validation.data.jobId);
        if (!status) {
          return { content: [{ type: 'text', text: 'Job not found' }], isError: true };
        }

        const job = await jobRepository.findById(validation.data.jobId);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              jobId: validation.data.jobId,
              ...status,
              details: job ? {
                type: job.type,
                inputPath: job.inputPath,
                config: job.config,
                result: job.result,
                error: job.error,
              } : null,
            }, null, 2),
          }],
        };
      }

      case 'cancel_job': {
        const validation = validateInput(JobStatusInputSchema, args);
        if (!validation.success) {
          return { content: [{ type: 'text', text: `Invalid input: ${validation.error}` }], isError: true };
        }

        const success = await cancelJob(validation.data.jobId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success, jobId: validation.data.jobId }, null, 2),
          }],
        };
      }

      case 'retry_job': {
        const validation = validateInput(JobStatusInputSchema, args);
        if (!validation.success) {
          return { content: [{ type: 'text', text: `Invalid input: ${validation.error}` }], isError: true };
        }

        const success = await retryJob(validation.data.jobId);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success, jobId: validation.data.jobId }, null, 2),
          }],
        };
      }

      case 'list_videos': {
        const validation = validateInput(ListVideosInputSchema, args);
        if (!validation.success) {
          return { content: [{ type: 'text', text: `Invalid input: ${validation.error}` }], isError: true };
        }

        const videos = await videoRepository.findAll();
        const limit = validation.data.limit ?? 50;
        const offset = validation.data.offset ?? 0;
        const paginated = videos.slice(offset, offset + limit);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              videos: paginated,
              total: videos.length,
              limit: validation.data.limit,
              offset: validation.data.offset,
            }, null, 2),
          }],
        };
      }

      case 'get_video_info': {
        const { videoPath } = args as { videoPath: string };

        const fsValidation = filesystemGuard.validatePath(videoPath, 'read');
        if (!fsValidation.allowed) {
          return { content: [{ type: 'text', text: `Filesystem error: ${fsValidation.error}` }], isError: true };
        }

        const info = await getVideoInfo(videoPath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(info, null, 2),
          }],
        };
      }

      case 'get_queue_stats': {
        const stats = await getQueueStats();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(stats, null, 2),
          }],
        };
      }

      case 'get_settings': {
        const settings = await settingsRepository.getAll();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(settings, null, 2),
          }],
        };
      }

      case 'update_setting': {
        const { key, value } = args as { key: string; value: string };
        await settingsRepository.set(key, value);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, key, value }, null, 2),
          }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
    };
  }
});

// Register resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: RESOURCES,
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case 'autoclipper://jobs/recent': {
        const jobs = await jobRepository.findAll('ORDER BY created_at DESC LIMIT 20');
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(jobs, null, 2),
          }],
        };
      }

      case 'autoclipper://videos/list': {
        const videos = await videoRepository.findAll();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(videos, null, 2),
          }],
        };
      }

      case 'autoclipper://settings': {
        const settings = await settingsRepository.getAll();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(settings, null, 2),
          }],
        };
      }

      case 'autoclipper://queue/stats': {
        const stats = await getQueueStats();
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(stats, null, 2),
          }],
        };
      }

      default:
        return {
          contents: [{
            uri,
            mimeType: 'text/plain',
            text: `Unknown resource: ${uri}`,
          }],
        };
    }
  } catch (error) {
    return {
      contents: [{
        uri,
        mimeType: 'text/plain',
        text: `Error reading resource: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
    };
  }
});

// Register prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: PROMPTS,
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'create_viral_clip': {
      const inputPath = args?.inputPath as string;
      const style = args?.style as string || 'viral';
      const platform = args?.platform as string || 'tiktok';
      const duration = args?.duration ? parseInt(args.duration as string, 10) : 60;

      return {
        description: `Create a viral ${style} clip for ${platform}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Process the video at ${inputPath} to create a viral ${style} short-form clip for ${platform} with target duration of ${duration} seconds. Use the process_video tool with appropriate settings for maximum viral potential.`,
            },
          },
        ],
      };
    }

    case 'analyze_video': {
      const inputPath = args?.inputPath as string;

      return {
        description: 'Analyze video for clipping potential',
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Analyze the video at ${inputPath} to identify the best segments for short-form viral clips. Use get_video_info to get technical details, then process_video with customPrompt focusing on highlight detection.`,
            },
          },
        ],
      };
    }

    default:
      return {
        description: 'Unknown prompt',
        messages: [],
      };
  }
});

// Main server function
export async function startMCPServer(): Promise<void> {
  // Initialize database
  await initializeDatabase();
  console.error('Database initialized');

  // Initialize queue
  await import('../queue/jobQueue').then(m => m.initializeQueue());
  console.error('Queue initialized');

  // Create transport
  const transport = new StdioServerTransport();

  // Connect
  await server.connect(transport);
  console.error('MCP Server started');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.error('Shutting down...');
    await closeDatabase();
    await import('../queue/jobQueue').then(m => m.closeQueue());
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Shutting down...');
    await closeDatabase();
    await import('../queue/jobQueue').then(m => m.closeQueue());
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  startMCPServer().catch((error) => {
    console.error('MCP Server failed to start:', error);
    process.exit(1);
  });
}