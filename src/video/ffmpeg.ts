// FFmpeg engine wrapper

import * as fs from 'fs';
import * as path from 'path';
import ffmpegStatic from 'ffmpeg-static';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import ffprobeStatic from 'ffprobe-static';
import { config } from '../config';
import { VideoInfo, FFmpegInfo } from '../types';

let cachedFFmpegInfo: FFmpegInfo | null = null;

export function getFFmpegPaths(): FFmpegInfo {
  if (cachedFFmpegInfo) return cachedFFmpegInfo;

  const ffmpegPath = config.ffmpegPath || ffmpegStatic || 'ffmpeg';
  const ffprobePath = config.ffprobePath || ffprobeStatic.path || 'ffprobe';

  // Get version
  let version = 'unknown';
  try {
    const { execSync } = require('child_process');
    const output = execSync(`"${ffmpegPath}" -version`, { encoding: 'utf-8', timeout: 5000 });
    const match = output.match(/ffmpeg version ([\d.]+)/);
    if (match) version = match[1];
  } catch {
    // Ignore version detection errors
  }

  cachedFFmpegInfo = { ffmpegPath, ffprobePath, version };
  return cachedFFmpegInfo;
}

export async function getVideoInfo(inputPath: string): Promise<VideoInfo> {
  const { ffprobePath } = getFFmpegPaths();

  // Validate file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Video file not found: ${inputPath}`);
  }

  const { execSync } = require('child_process');

  // Get video info using ffprobe
  const cmd = `"${ffprobePath}" -v quiet -print_format json -show_format -show_streams "${inputPath}"`;

  let output: string;
  try {
    output = execSync(cmd, { encoding: 'utf-8', timeout: 30000, maxBuffer: 1024 * 1024 });
  } catch (error) {
    throw new Error(`FFprobe failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  let probeData: any;
  try {
    probeData = JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse ffprobe output: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Find video and audio streams
  const videoStream = probeData.streams?.find((s: any) => s.codec_type === 'video');
  const audioStream = probeData.streams?.find((s: any) => s.codec_type === 'audio');
  const format = probeData.format || {};

  if (!videoStream) {
    throw new Error('No video stream found in file');
  }

  // Parse duration
  const duration = parseFloat(format.duration || videoStream.duration || '0');

  // Parse fps
  let fps = 30;
  if (videoStream.r_frame_rate) {
    const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
    if (den > 0) fps = num / den;
  }

  // Parse bitrate
  const videoBitrate = parseInt(videoStream.bit_rate || format.bit_rate || '0', 10);
  const audioBitrate = parseInt(audioStream?.bit_rate || '0', 10);

  const fileStats = fs.statSync(inputPath);

  return {
    path: inputPath,
    duration,
    width: videoStream.width || 0,
    height: videoStream.height || 0,
    fps,
    videoCodec: videoStream.codec_name || 'unknown',
    audioCodec: audioStream?.codec_name || 'none',
    videoBitrate,
    audioBitrate,
    format: format.format_name || 'unknown',
    fileSize: fileStats.size,
    hasAudio: !!audioStream,
    hasVideo: !!videoStream,
  };
}

export interface RenderOptions {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
  width: number;
  height: number;
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  subtitlePath?: string;
  subtitleStyle?: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    outlineColor: string;
    outlineWidth: number;
    backgroundColor?: string;
    backgroundOpacity: number;
    position: 'bottom' | 'top' | 'center';
    margin: number;
  };
  watermarkPath?: string;
  preset?: 'fast' | 'medium' | 'slow' | 'veryslow';
  crf?: number;
}

export async function renderVideo(options: RenderOptions): Promise<void> {
  const { ffmpegPath } = getFFmpegPaths();
  const {
    inputPath,
    outputPath,
    startTime,
    duration,
    width,
    height,
    fps = config.fps,
    videoBitrate = config.videoBitrate,
    audioBitrate = config.audioBitrate,
    subtitlePath,
    subtitleStyle,
    watermarkPath,
    preset = 'medium',
    crf = 23,
  } = options;

  // Validate input
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video not found: ${inputPath}`);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Build filter complex
  const filters: string[] = [];

  // Scale and pad to target aspect ratio (9:16 = portrait)
  const targetAspect = width / height;
  filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`);

  // FPS filter
  filters.push(`fps=${fps}`);

  // Subtitle filter
  if (subtitlePath && fs.existsSync(subtitlePath)) {
    const style = subtitleStyle || {
      fontFamily: config.subtitleFontFamily,
      fontSize: config.subtitleFontSize,
      fontColor: config.subtitleFontColor,
      outlineColor: config.subtitleOutlineColor,
      outlineWidth: config.subtitleOutlineWidth,
      backgroundColor: '#000000',
      backgroundOpacity: 0.5,
      position: config.subtitlePosition,
      margin: config.subtitleMargin,
    };

    const marginV = style.position === 'bottom' ? style.margin :
                    style.position === 'top' ? style.margin : height / 2;

    const subtitleFilter = `subtitles='${subtitlePath.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}':force_style='FontName=${style.fontFamily},FontSize=${style.fontSize},PrimaryColour=&H${style.fontColor.replace('#', '')},OutlineColour=&H${style.outlineColor.replace('#', '')},Outline=${style.outlineWidth},MarginV=${marginV},Alignment=${style.position === 'top' ? 8 : style.position === 'center' ? 5 : 2}'`;
    filters.push(subtitleFilter);
  }

  // Watermark filter
  if (watermarkPath && fs.existsSync(watermarkPath)) {
    filters.push(`movie=${watermarkPath} [watermark]; [in][watermark] overlay=W-w-20:H-h-20 [out]`);
  }

  const filterComplex = filters.join(',');

  // Build ffmpeg command
  const args = [
    '-y', // Overwrite output
    '-ss', String(startTime),
    '-t', String(duration),
    '-i', inputPath,
    '-vf', filterComplex,
    '-c:v', 'libx264',
    '-preset', preset,
    '-crf', String(crf),
    '-b:v', videoBitrate,
    '-maxrate', videoBitrate,
    '-bufsize', String(parseInt(videoBitrate) * 2) + 'k',
    '-c:a', 'aac',
    '-b:a', audioBitrate,
    '-ar', '44100',
    '-movflags', '+faststart',
    outputPath,
  ];

  const cmd = `"${ffmpegPath}" ${args.map(a => `"${a}"`).join(' ')}`;

  const { execSync } = require('child_process');

  try {
    execSync(cmd, {
      encoding: 'utf-8',
      timeout: 300000, // 5 minutes max
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error: any) {
    // Check if output file was created partially
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    throw new Error(`FFmpeg render failed: ${error.message}\nCommand: ${cmd}`);
  }

  // Verify output
  if (!fs.existsSync(outputPath)) {
    throw new Error('Render completed but output file not found');
  }

  const stats = fs.statSync(outputPath);
  if (stats.size === 0) {
    fs.unlinkSync(outputPath);
    throw new Error('Render produced empty file');
  }
}

export async function extractAudio(inputPath: string, outputPath: string, startTime = 0, duration?: number): Promise<void> {
  const { ffmpegPath } = getFFmpegPaths();

  const args = [
    '-y',
    '-ss', String(startTime),
    '-i', inputPath,
    '-vn', // No video
    '-acodec', 'pcm_s16le', // Uncompressed WAV
    '-ar', '16000', // 16kHz for transcription
    '-ac', '1', // Mono
  ];

  if (duration) {
    args.push('-t', String(duration));
  }

  args.push(outputPath);

  const cmd = `"${ffmpegPath}" ${args.map(a => `"${a}"`).join(' ')}`;

  const { execSync } = require('child_process');

  try {
    execSync(cmd, { encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
  } catch (error: any) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw new Error(`Audio extraction failed: ${error.message}`);
  }
}

export async function generateThumbnail(inputPath: string, outputPath: string, time = 1): Promise<void> {
  const { ffmpegPath } = getFFmpegPaths();

  const args = [
    '-y',
    '-ss', String(time),
    '-i', inputPath,
    '-vframes', '1',
    '-vf', 'scale=320:-1',
    outputPath,
  ];

  const cmd = `"${ffmpegPath}" ${args.map(a => `"${a}"`).join(' ')}`;

  const { execSync } = require('child_process');

  try {
    execSync(cmd, { encoding: 'utf-8', timeout: 30000 });
  } catch (error: any) {
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
}

export async function getVideoDuration(inputPath: string): Promise<number> {
  const info = await getVideoInfo(inputPath);
  return info.duration;
}

export function validateVideoFile(filePath: string): { valid: boolean; error?: string } {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'File not found' };
  }

  const ext = path.extname(filePath).toLowerCase();
  if (!config.allowedVideoExtensions.includes(ext)) {
    return { valid: false, error: `Unsupported video format: ${ext}` };
  }

  const stats = fs.statSync(filePath);
  if (stats.size > config.maxFileSize) {
    return { valid: false, error: `File too large: ${stats.size} bytes (max: ${config.maxFileSize})` };
  }

  return { valid: true };
}