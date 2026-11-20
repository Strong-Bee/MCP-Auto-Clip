// Application configuration

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// Load .env file
function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  }
}

loadEnv();

// Configuration schema
const ConfigSchema = z.object({
  // Server
  port: z.number().default(3000),
  host: z.string().default('localhost'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  databasePath: z.string().default('./data/autoclipper.sqlite'),

  // FFmpeg
  ffmpegPath: z.string().optional(),
  ffprobePath: z.string().optional(),

  // AI Providers
  openaiApiKey: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  openaiModel: z.string().default('gpt-4o'),

  anthropicApiKey: z.string().optional(),
  anthropicBaseUrl: z.string().optional(),
  anthropicModel: z.string().default('claude-3-5-sonnet-20241022'),

  googleApiKey: z.string().optional(),
  googleModel: z.string().default('gemini-1.5-pro'),

  nvidiaApiKey: z.string().optional(),
  nvidiaBaseUrl: z.string().optional(),
  nvidiaModel: z.string().default('parakeet-tdt-1.1b'),

  // Redis (for job queue)
  redisUrl: z.string().default('redis://localhost:6379'),
  redisEnabled: z.boolean().default(false),

  // Storage
  storagePath: z.string().default('./storage'),
  tempPath: z.string().default('./temp'),
  outputPath: z.string().default('./output'),

  // Video Processing
  defaultAspectRatio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  defaultTargetDuration: z.number().default(60),
  maxClipsPerJob: z.number().default(10),
  minClipDuration: z.number().default(15),
  maxClipDuration: z.number().default(120),
  videoBitrate: z.string().default('2M'),
  audioBitrate: z.string().default('128k'),
  fps: z.number().default(30),

  // Subtitle
  subtitleFontFamily: z.string().default('Arial'),
  subtitleFontSize: z.number().default(24),
  subtitleFontColor: z.string().default('#FFFFFF'),
  subtitleOutlineColor: z.string().default('#000000'),
  subtitleOutlineWidth: z.number().default(2),
  subtitlePosition: z.enum(['bottom', 'top', 'center']).default('bottom'),
  subtitleMargin: z.number().default(50),

  // Quality
  qualityThreshold: z.number().min(0).max(1).default(0.7),
  enableViralScoring: z.boolean().default(true),
  maxRetryAttempts: z.number().default(2),

  // Logging
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
  logPretty: z.boolean().default(true),

  // Security
  allowedPaths: z.array(z.string()).default(['./storage', './temp', './output']),
  maxFileSize: z.number().default(500 * 1024 * 1024), // 500MB
  allowedVideoExtensions: z.array(z.string()).default(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv']),
  allowedAudioExtensions: z.array(z.string()).default(['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac']),

  // MCP
  mcpServerName: z.string().default('auto-clipper'),
  mcpServerVersion: z.string().default('1.0.0'),
});

// Parse and validate config
const rawConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  nodeEnv: (process.env.NODE_ENV as any) || 'development',
  databasePath: process.env.DATABASE_PATH || './data/autoclipper.sqlite',
  ffmpegPath: process.env.FFMPEG_PATH,
  ffprobePath: process.env.FFPROBE_PATH,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseUrl: process.env.OPENAI_BASE_URL,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
  googleApiKey: process.env.GOOGLE_API_KEY,
  googleModel: process.env.GOOGLE_MODEL || 'gemini-1.5-pro',

  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  nvidiaModel: process.env.NVIDIA_MODEL || 'parakeet-tdt-1.1b',

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisEnabled: process.env.REDIS_ENABLED === 'true',
  storagePath: process.env.STORAGE_PATH || './storage',
  tempPath: process.env.TEMP_PATH || './temp',
  outputPath: process.env.OUTPUT_PATH || './output',
  defaultAspectRatio: (process.env.DEFAULT_ASPECT_RATIO as any) || '9:16',
  defaultTargetDuration: parseInt(process.env.DEFAULT_TARGET_DURATION || '60', 10),
  maxClipsPerJob: parseInt(process.env.MAX_CLIPS_PER_JOB || '10', 10),
  minClipDuration: parseInt(process.env.MIN_CLIP_DURATION || '15', 10),
  maxClipDuration: parseInt(process.env.MAX_CLIP_DURATION || '120', 10),
  videoBitrate: process.env.VIDEO_BITRATE || '2M',
  audioBitrate: process.env.AUDIO_BITRATE || '128k',
  fps: parseInt(process.env.FPS || '30', 10),
  subtitleFontFamily: process.env.SUBTITLE_FONT_FAMILY || 'Arial',
  subtitleFontSize: parseInt(process.env.SUBTITLE_FONT_SIZE || '24', 10),
  subtitleFontColor: process.env.SUBTITLE_FONT_COLOR || '#FFFFFF',
  subtitleOutlineColor: process.env.SUBTITLE_OUTLINE_COLOR || '#000000',
  subtitleOutlineWidth: parseInt(process.env.SUBTITLE_OUTLINE_WIDTH || '2', 10),
  subtitlePosition: (process.env.SUBTITLE_POSITION as any) || 'bottom',
  subtitleMargin: parseInt(process.env.SUBTITLE_MARGIN || '50', 10),
  qualityThreshold: parseFloat(process.env.QUALITY_THRESHOLD || '0.7'),
  enableViralScoring: process.env.ENABLE_VIRAL_SCORING !== 'false',
  maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '2', 10),
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
  logPretty: process.env.LOG_PRETTY !== 'false',
  allowedPaths: (process.env.ALLOWED_PATHS || './storage,./temp,./output').split(','),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(500 * 1024 * 1024), 10),
  allowedVideoExtensions: (process.env.ALLOWED_VIDEO_EXTENSIONS || '.mp4,.mov,.avi,.mkv,.webm,.flv').split(','),
  allowedAudioExtensions: (process.env.ALLOWED_AUDIO_EXTENSIONS || '.mp3,.wav,.aac,.m4a,.ogg,.flac').split(','),
  mcpServerName: process.env.MCP_SERVER_NAME || 'auto-clipper',
  mcpServerVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
};

export const config = ConfigSchema.parse(rawConfig);

// Ensure directories exist
function ensureDirs(): void {
  const dirs = [
    config.storagePath,
    config.tempPath,
    config.outputPath,
    path.dirname(config.databasePath),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

ensureDirs();

export type Config = z.infer<typeof ConfigSchema>;