// Clip planning service

import { Highlight, ClipSpec, ClipPlan, JobConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ClipPlanResult {
  highlights: Highlight[];
  clips: ClipSpec[];
  totalDuration: number;
  estimatedRenderTime: number;
}

export async function planClips(
  highlights: Highlight[],
  jobConfig: JobConfig
): Promise<ClipPlanResult> {
  const clips: ClipSpec[] = [];
  let totalDuration = 0;

  // Configuration
  const targetDuration = jobConfig.targetDuration || 60;
  const maxClips = jobConfig.maxClips || 10;
  const minClipDuration = jobConfig.minClipDuration || 15;
  const maxClipDuration = jobConfig.maxClipDuration || 120;
  const aspectRatio = jobConfig.aspectRatio || '9:16';

  // Calculate target dimensions
  let width = 1080;
  let height = 1920;

  if (aspectRatio === '16:9') {
    width = 1920;
    height = 1080;
  } else if (aspectRatio === '1:1') {
    width = 1080;
    height = 1080;
  }

  // Sort highlights by score (best first)
  const sortedHighlights = [...highlights].sort((a, b) => b.score - a.score);

  // Select top highlights up to maxClips
  const selectedHighlights = sortedHighlights.slice(0, maxClips);

  for (const highlight of selectedHighlights) {
    // Adjust clip duration to fit within constraints
    let clipDuration = highlight.endTime - highlight.startTime;

    if (clipDuration < minClipDuration) {
      // Extend clip to minimum duration
      const extension = minClipDuration - clipDuration;
      const newStart = Math.max(0, highlight.startTime - extension / 2);
      const newEnd = Math.min(highlight.endTime + extension / 2, highlight.endTime + extension);
      clipDuration = newEnd - newStart;
    } else if (clipDuration > maxClipDuration) {
      // Trim clip to maximum duration
      const trim = clipDuration - maxClipDuration;
      const newStart = highlight.startTime + trim / 2;
      const newEnd = highlight.endTime - trim / 2;
      clipDuration = newEnd - newStart;
    }

    // Check if adding this clip would exceed target total duration
    if (totalDuration + clipDuration > targetDuration * 1.5 && clips.length > 0) {
      // We have enough content, stop here
      break;
    }

    const clip: ClipSpec = {
      id: uuidv4(),
      jobId: highlight.jobId,
      highlightId: highlight.id,
      startTime: highlight.startTime,
      endTime: highlight.endTime,
      duration: clipDuration,
      outputPath: '', // Will be set during rendering
      status: 'pending',
      retryCount: 0,
      viralScore: undefined,
      metadata: undefined,
    };

    clips.push(clip);
    totalDuration += clipDuration;
  }

  // If no clips created, create at least one from the best highlight
  if (clips.length === 0 && highlights.length > 0) {
    const best = highlights[0];
    const clipDuration = Math.min(Math.max(best.endTime - best.startTime, minClipDuration), maxClipDuration);

    clips.push({
      id: uuidv4(),
      jobId: best.jobId,
      highlightId: best.id,
      startTime: best.startTime,
      endTime: best.startTime + clipDuration,
      duration: clipDuration,
      outputPath: '',
      status: 'pending',
      retryCount: 0,
    });
    totalDuration = clipDuration;
  }

  // Estimate render time (roughly 2-3x realtime per clip)
  const estimatedRenderTime = clips.reduce((sum, clip) => sum + clip.duration * 3, 0);

  return {
    highlights: selectedHighlights,
    clips,
    totalDuration,
    estimatedRenderTime,
  };
}

export function adjustClipTiming(
  clip: ClipSpec,
  transcription: any,
  paddingSeconds = 1
): { startTime: number; endTime: number } {
  // Find the nearest sentence boundaries for cleaner cuts
  const segments = transcription.segments || [];

  let bestStart = clip.startTime;
  let bestEnd = clip.endTime;

  // Find segment containing start time
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.startTime <= clip.startTime && seg.endTime >= clip.startTime) {
      // Use segment start if close
      if (clip.startTime - seg.startTime < paddingSeconds) {
        bestStart = seg.startTime;
      }
      break;
    }
  }

  // Find segment containing end time
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    if (seg.startTime <= clip.endTime && seg.endTime >= clip.endTime) {
      // Use segment end if close
      if (seg.endTime - clip.endTime < paddingSeconds) {
        bestEnd = seg.endTime;
      }
      break;
    }
  }

  return { startTime: bestStart, endTime: bestEnd };
}

export function optimizeClipsForPlatform(
  clips: ClipSpec[],
  platform: 'tiktok' | 'reels' | 'shorts' | 'generic'
): ClipSpec[] {
  const platformLimits: Record<string, { maxDuration: number; recommendedDuration: number }> = {
    tiktok: { maxDuration: 60, recommendedDuration: 15 },
    reels: { maxDuration: 90, recommendedDuration: 30 },
    shorts: { maxDuration: 60, recommendedDuration: 15 },
    generic: { maxDuration: 120, recommendedDuration: 60 },
  };

  const limits = platformLimits[platform] || platformLimits.generic;

  return clips.map(clip => {
    let newDuration = clip.duration;
    let newEndTime = clip.endTime;

    if (newDuration > limits.maxDuration) {
      newDuration = limits.maxDuration;
      newEndTime = clip.startTime + newDuration;
    }

    return {
      ...clip,
      duration: newDuration,
      endTime: newEndTime,
    };
  });
}