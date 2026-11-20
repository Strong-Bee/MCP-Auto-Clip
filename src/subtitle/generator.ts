// Subtitle generation service

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ClipSpec, TranscriptionResult, SubtitleStyle, JobConfig } from '../types';
import { config } from '../config';

export async function generateSubtitles(
  clip: ClipSpec,
  transcription: TranscriptionResult,
  jobConfig: JobConfig
): Promise<string> {
  // Filter segments that fall within clip time range
  const clipSegments = transcription.segments.filter(
    seg => seg.endTime > clip.startTime && seg.startTime < clip.endTime
  );

  if (clipSegments.length === 0) {
    // Create empty subtitle file
    return createEmptySubtitleFile(clip);
  }

  // Generate SRT content
  const srtContent = generateSRT(clipSegments, clip.startTime);

  // Write subtitle file
  const subtitleDir = path.join(config.tempPath, 'subtitles', clip.jobId);
  if (!fs.existsSync(subtitleDir)) {
    fs.mkdirSync(subtitleDir, { recursive: true });
  }

  const subtitlePath = path.join(subtitleDir, `${clip.id}.srt`);
  fs.writeFileSync(subtitlePath, srtContent, 'utf-8');

  return subtitlePath;
}

function generateSRT(segments: any[], clipStartTime: number): string {
  let srt = '';
  let index = 1;

  for (const seg of segments) {
    // Adjust times relative to clip start
    const startTime = Math.max(0, seg.startTime - clipStartTime);
    const endTime = Math.max(0, seg.endTime - clipStartTime);

    // Skip very short segments
    if (endTime - startTime < 0.1) continue;

    const startSRT = formatSRTTime(startTime);
    const endSRT = formatSRTTime(endTime);

    srt += `${index}\n`;
    srt += `${startSRT} --> ${endSRT}\n`;
    srt += `${seg.text.trim()}\n\n`;
    index++;
  }

  return srt;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function createEmptySubtitleFile(clip: ClipSpec): string {
  const subtitleDir = path.join(config.tempPath, 'subtitles', clip.jobId);
  if (!fs.existsSync(subtitleDir)) {
    fs.mkdirSync(subtitleDir, { recursive: true });
  }

  const subtitlePath = path.join(subtitleDir, `${clip.id}.srt`);
  // Create minimal valid SRT
  fs.writeFileSync(subtitlePath, '1\n00:00:00,000 --> 00:00:01,000\n \n\n', 'utf-8');

  return subtitlePath;
}

export function generateASSSubtitles(
  segments: any[],
  clipStartTime: number,
  style: SubtitleStyle
): string {
  // Advanced ASS format with styling
  const header = `[Script Info]
Title: Auto Clipper Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},&H${hexColor(style.fontColor)}&,&H${hexColor(style.fontColor)}&,&H${hexColor(style.outlineColor)}&,&H${hexColor(style.backgroundColor || '#000000')}${Math.round((style.backgroundOpacity || 0.5) * 255).toString(16).padStart(2, '0')}&,0,0,0,0,100,100,0,0,1,${style.outlineWidth},0,${getAlignment(style.position)},20,20,${style.margin},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  let events = '';
  let index = 1;

  for (const seg of segments) {
    const startTime = Math.max(0, seg.startTime - clipStartTime);
    const endTime = Math.max(0, seg.endTime - clipStartTime);

    if (endTime - startTime < 0.1) continue;

    const startASS = formatASSTime(startTime);
    const endASS = formatASSTime(endTime);

    events += `Dialogue: 0,${startASS},${endASS},Default,,0,0,0,,${escapeASSText(seg.text.trim())}\n`;
    index++;
  }

  return header + events;
}

function formatASSTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);

  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

function hexColor(color: string): string {
  // Convert #RRGGBB to ASS format (BBGGRR)
  const hex = color.replace('#', '');
  if (hex.length === 6) {
    return hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);
  }
  return 'FFFFFF';
}

function getAlignment(position: string): number {
  switch (position) {
    case 'top': return 8;
    case 'center': return 5;
    case 'bottom':
    default: return 2;
  }
}

function escapeASSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\n/g, '\\N');
}

export async function burnSubtitles(
  inputPath: string,
  outputPath: string,
  subtitlePath: string,
  style: SubtitleStyle
): Promise<void> {
  // This is handled in ffmpeg.ts renderVideo function
  // Kept here for potential standalone use
  const { renderVideo } = await import('../video/ffmpeg');

  await renderVideo({
    inputPath,
    outputPath,
    startTime: 0,
    duration: 0, // Will be calculated
    width: 1080,
    height: 1920,
    subtitlePath,
    subtitleStyle: style,
  });
}