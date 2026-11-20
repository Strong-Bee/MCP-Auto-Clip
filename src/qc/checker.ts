// Quality control service

import * as fs from 'fs';
import * as path from 'path';
import { ClipSpec, QualityCheckResult, QualityIssue, QualityMetrics } from '../types';
import { config } from '../config';
import { getVideoInfo } from '../video/ffmpeg';
import { v4 as uuidv4 } from 'uuid';

export async function qualityCheck(
  videoPath: string,
  clip: ClipSpec
): Promise<QualityCheckResult> {
  const issues: QualityIssue[] = [];

  // Check file exists
  if (!fs.existsSync(videoPath)) {
    issues.push({
      type: 'video',
      severity: 'critical',
      message: 'Output video file not found',
      autoFixable: false,
    });

    return {
      id: uuidv4(),
      clipId: clip.id,
      passed: false,
      score: 0,
      issues,
      metrics: getEmptyMetrics(),
    };
  }

  // Get video info
  let videoInfo;
  try {
    videoInfo = await getVideoInfo(videoPath);
  } catch (error) {
    issues.push({
      type: 'video',
      severity: 'critical',
      message: `Failed to analyze video: ${error instanceof Error ? error.message : 'Unknown error'}`,
      autoFixable: false,
    });

    return {
      id: uuidv4(),
      clipId: clip.id,
      passed: false,
      score: 0,
      issues,
      metrics: getEmptyMetrics(),
    };
  }

  // Check 1: Duration matches expected
  const durationDiff = Math.abs(videoInfo.duration - clip.duration);
  if (durationDiff > 2) { // Allow 2 second tolerance
    issues.push({
      type: 'video',
      severity: durationDiff > 5 ? 'high' : 'medium',
      message: `Duration mismatch: expected ${clip.duration.toFixed(1)}s, got ${videoInfo.duration.toFixed(1)}s`,
      timestamp: 0,
      autoFixable: true,
    });
  }

  // Check 2: Resolution and aspect ratio (9:16 = 1080x1920)
  const expectedWidth = 1080;
  const expectedHeight = 1920;
  const expectedAspect = expectedWidth / expectedHeight;
  const actualAspect = videoInfo.width / videoInfo.height;
  const aspectDiff = Math.abs(actualAspect - expectedAspect);

  if (aspectDiff > 0.02) { // ~2% tolerance
    issues.push({
      type: 'format',
      severity: 'high',
      message: `Incorrect aspect ratio: expected 9:16 (${expectedAspect.toFixed(3)}), got ${videoInfo.width}x${videoInfo.height} (${actualAspect.toFixed(3)})`,
      autoFixable: true,
    });
  }

  // Check 3: Minimum resolution
  if (videoInfo.width < 720 || videoInfo.height < 1280) {
    issues.push({
      type: 'video',
      severity: 'medium',
      message: `Resolution below minimum: ${videoInfo.width}x${videoInfo.height} (min 720x1280)`,
      autoFixable: true,
    });
  }

  // Check 4: Video bitrate
  const minVideoBitrate = parseBitrate(config.videoBitrate) * 0.5; // 50% of target
  if (videoInfo.videoBitrate > 0 && videoInfo.videoBitrate < minVideoBitrate) {
    issues.push({
      type: 'video',
      severity: 'medium',
      message: `Video bitrate too low: ${formatBitrate(videoInfo.videoBitrate)} (target: ${config.videoBitrate})`,
      autoFixable: true,
    });
  }

  // Check 5: Audio presence and bitrate
  if (!videoInfo.hasAudio) {
    issues.push({
      type: 'audio',
      severity: 'high',
      message: 'Output video has no audio track',
      autoFixable: false,
    });
  } else if (videoInfo.audioBitrate > 0 && videoInfo.audioBitrate < 64000) {
    issues.push({
      type: 'audio',
      severity: 'low',
      message: `Audio bitrate low: ${formatBitrate(videoInfo.audioBitrate)}`,
      autoFixable: true,
    });
  }

  // Check 6: File size
  const fileSizeMB = videoInfo.fileSize / (1024 * 1024);
  const maxSizeMB = 100; // 100MB max for short clips
  if (fileSizeMB > maxSizeMB) {
    issues.push({
      type: 'video',
      severity: 'medium',
      message: `File size large: ${fileSizeMB.toFixed(1)}MB (max ${maxSizeMB}MB)`,
      autoFixable: true,
    });
  }

  // Check 7: Codec compatibility
  const preferredVideoCodecs = ['h264', 'libx264'];
  const preferredAudioCodecs = ['aac', 'mp3'];

  if (!preferredVideoCodecs.some(c => videoInfo.videoCodec.toLowerCase().includes(c))) {
    issues.push({
      type: 'format',
      severity: 'low',
      message: `Non-standard video codec: ${videoInfo.videoCodec}`,
      autoFixable: true,
    });
  }

  if (videoInfo.hasAudio && !preferredAudioCodecs.some(c => videoInfo.audioCodec.toLowerCase().includes(c))) {
    issues.push({
      type: 'format',
      severity: 'low',
      message: `Non-standard audio codec: ${videoInfo.audioCodec}`,
      autoFixable: true,
    });
  }

  // Check 8: Frame rate
  if (videoInfo.fps < 24 || videoInfo.fps > 60) {
    issues.push({
      type: 'video',
      severity: 'low',
      message: `Unusual frame rate: ${videoInfo.fps.toFixed(1)} fps`,
      autoFixable: true,
    });
  }

  // Check 9: Subtitle sync (if subtitle exists)
  if (clip.subtitlePath && fs.existsSync(clip.subtitlePath)) {
    const syncOffset = await checkSubtitleSync(clip.subtitlePath, videoInfo.duration);
    if (Math.abs(syncOffset) > 1) {
      issues.push({
        type: 'sync',
        severity: Math.abs(syncOffset) > 3 ? 'high' : 'medium',
        message: `Subtitle sync offset: ${syncOffset > 0 ? '+' : ''}${syncOffset.toFixed(1)}s`,
        autoFixable: true,
      });
    }
  }

  // Calculate quality score
  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const highIssues = issues.filter(i => i.severity === 'high').length;
  const mediumIssues = issues.filter(i => i.severity === 'medium').length;
  const lowIssues = issues.filter(i => i.severity === 'low').length;

  let score = 1.0;
  score -= criticalIssues * 0.5;
  score -= highIssues * 0.2;
  score -= mediumIssues * 0.1;
  score -= lowIssues * 0.05;
  score = Math.max(0, score);

  const passed = criticalIssues === 0 && highIssues === 0 && score >= config.qualityThreshold;

  // Calculate video quality score (0-1)
  const videoQualityScore = calculateVideoQualityScore(videoInfo, issues);

  // Estimate audio loudness (would need ffmpeg analysis in real implementation)
  const audioLoudness = -23; // LUFS placeholder

  const metrics: QualityMetrics = {
    videoBitrate: videoInfo.videoBitrate,
    audioBitrate: videoInfo.audioBitrate,
    resolution: { width: videoInfo.width, height: videoInfo.height },
    aspectRatio: `${videoInfo.width}:${videoInfo.height}`,
    duration: videoInfo.duration,
    subtitleSyncOffset: clip.subtitlePath ? await checkSubtitleSync(clip.subtitlePath, videoInfo.duration) : 0,
    audioLoudness,
    videoQualityScore,
  };

  return {
    id: uuidv4(),
    clipId: clip.id,
    passed,
    score,
    issues,
    metrics,
  };
}

async function checkSubtitleSync(subtitlePath: string, videoDuration: number): Promise<number> {
  // Simple SRT parsing to check first and last subtitle timing
  try {
    const content = fs.readFileSync(subtitlePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    let firstTime = 0;
    let lastTime = 0;
    let foundFirst = false;

    for (const line of lines) {
      const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})/);
      if (timeMatch) {
        const startSec = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
        const endSec = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;

        if (!foundFirst) {
          firstTime = startSec;
          foundFirst = true;
        }
        lastTime = endSec;
      }
    }

    // Check if subtitles cover the video duration reasonably
    const expectedEnd = videoDuration;
    const coverage = lastTime / expectedEnd;

    if (coverage < 0.5) {
      return -(expectedEnd - lastTime); // Subtitles end too early
    } else if (coverage > 1.5) {
      return lastTime - expectedEnd; // Subtitles extend beyond video
    }

    return 0; // Good sync
  } catch {
    return 0;
  }
}

function calculateVideoQualityScore(videoInfo: any, issues: QualityIssue[]): number {
  let score = 1.0;

  // Resolution score
  const pixelCount = videoInfo.width * videoInfo.height;
  const targetPixels = 1080 * 1920;
  const resolutionRatio = Math.min(1, pixelCount / targetPixels);
  score *= 0.7 + 0.3 * resolutionRatio;

  // Bitrate score
  const targetBitrate = parseBitrate(config.videoBitrate);
  if (videoInfo.videoBitrate > 0) {
    const bitrateRatio = Math.min(1, videoInfo.videoBitrate / targetBitrate);
    score *= 0.8 + 0.2 * bitrateRatio;
  }

  // Codec score
  if (videoInfo.videoCodec.toLowerCase().includes('h264') || videoInfo.videoCodec.toLowerCase().includes('libx264')) {
    score *= 1.0;
  } else {
    score *= 0.9;
  }

  // Penalty for issues
  const videoIssues = issues.filter(i => i.type === 'video' || i.type === 'format');
  score -= videoIssues.length * 0.05;

  return Math.max(0, Math.min(1, score));
}

function parseBitrate(bitrateStr: string): number {
  const match = bitrateStr.match(/^(\d+(?:\.\d+)?)([KM]?)$/i);
  if (!match) return 2000000; // Default 2Mbps

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case 'K': return value * 1000;
    case 'M': return value * 1000000;
    default: return value;
  }
}

function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(1)}M`;
  if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(0)}K`;
  return `${bitrate}`;
}

function getEmptyMetrics(): QualityMetrics {
  return {
    videoBitrate: 0,
    audioBitrate: 0,
    resolution: { width: 0, height: 0 },
    aspectRatio: '0:0',
    duration: 0,
    subtitleSyncOffset: 0,
    audioLoudness: 0,
    videoQualityScore: 0,
  };
}

export async function autoFixIssues(
  videoPath: string,
  issues: QualityIssue[],
  clip: ClipSpec
): Promise<string | null> {
  // This would implement automatic fixes for common issues
  // For now, return null to indicate manual intervention needed
  const fixableIssues = issues.filter(i => i.autoFixable);

  if (fixableIssues.length === 0) return null;

  console.log(`[QC] Auto-fix not yet implemented for ${fixableIssues.length} issues`);
  return null;
}