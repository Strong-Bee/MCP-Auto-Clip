// Main job worker - processes video clipping jobs

import { config } from '../config';
import { initializeDatabase, closeDatabase } from '../config/database';
import { initializeQueue, registerJobProcessor, closeQueue, getQueueStats } from '../queue/jobQueue';
import { jobRepository } from '../database/repositories';
import { JobType, JobStatus, ClipStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

// Import services
import { transcribeAudio } from '../ai/transcription';
import { detectHighlights } from '../ai/highlights';
import { planClips } from '../video/clipPlanner';
import { generateSubtitles } from '../subtitle/generator';
import { renderVideo } from '../video/ffmpeg';
import { generateMetadata } from '../metadata/generator';
import { scoreViral } from '../metadata/viralScorer';
import { qualityCheck } from '../qc/checker';

// Register job processors
registerJobProcessor('process_video', async (job) => {
  const { jobId, inputPath, outputDir, config: jobConfig } = job.data;

  console.log(`[Worker] Processing job ${jobId}: ${job.type}`);

  try {
    // Step 1: Transcribe
    await jobRepository.updateStatus(jobId, 'processing', {
      currentStep: 'transcribing',
      stepProgress: 10,
      completedSteps: ['ingested', 'transcribing'],
    });

    const audioPath = path.join(config.tempPath, 'audio', jobId, `${jobId}.wav`);
    const transcription = await transcribeAudio(audioPath, jobConfig);

    // Step 2: Detect highlights
    await jobRepository.updateStatus(jobId, 'processing', {
      currentStep: 'detecting_highlights',
      stepProgress: 25,
      completedSteps: ['ingested', 'transcribing', 'detecting_highlights'],
    });

    const highlights = await detectHighlights(transcription, jobConfig);

    // Step 3: Plan clips
    await jobRepository.updateStatus(jobId, 'processing', {
      currentStep: 'planning_clips',
      stepProgress: 40,
      completedSteps: ['ingested', 'transcribing', 'detecting_highlights', 'planning_clips'],
    });

    const clipPlan = await planClips(highlights, jobConfig);

    // Step 4: Process each clip
    const clips = clipPlan.clips;
    const totalClips = clips.length;

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];

      await jobRepository.updateStatus(jobId, 'processing', {
        currentStep: `rendering_clip_${i + 1}_of_${totalClips}`,
        stepProgress: 40 + Math.floor((i / totalClips) * 40),
        currentClipIndex: i,
        totalClips,
        completedSteps: ['ingested', 'transcribing', 'detecting_highlights', 'planning_clips'],
      });

      // Generate subtitle
      await jobRepository.updateStatus(jobId, 'processing', {
        currentStep: `generating_subtitle_${i + 1}_of_${totalClips}`,
      });

      const subtitlePath = await generateSubtitles(clip, transcription, jobConfig);

      // Render video
      await jobRepository.updateStatus(jobId, 'processing', {
        currentStep: `rendering_clip_${i + 1}_of_${totalClips}`,
      });

      const outputPath = path.join(outputDir, `${jobId}_clip_${clip.id}.mp4`);
      await renderVideo({
        inputPath,
        outputPath,
        startTime: clip.startTime,
        duration: clip.duration,
        width: 1080,
        height: 1920,
        subtitlePath,
        subtitleStyle: jobConfig.subtitleStyle,
      });

      // Update clip with output path
      // (would need clipRepository.update here)

      // Generate metadata
      await jobRepository.updateStatus(jobId, 'processing', {
        currentStep: `generating_metadata_${i + 1}_of_${totalClips}`,
      });

      const metadata = await generateMetadata(clip, transcription, jobConfig);

      // Score viral potential
      if (jobConfig.enableViralScoring) {
        await jobRepository.updateStatus(jobId, 'processing', {
          currentStep: `scoring_viral_${i + 1}_of_${totalClips}`,
        });

        const viralScore = await scoreViral(clip, metadata, jobConfig);
      }

      // Quality check
      await jobRepository.updateStatus(jobId, 'processing', {
        currentStep: `quality_check_${i + 1}_of_${totalClips}`,
      });

      const qcResult = await qualityCheck(outputPath, clip);

      if (!qcResult.passed && qcResult.metrics.videoQualityScore < jobConfig.qualityThreshold!) {
        // Retry logic would go here
        console.warn(`Clip ${clip.id} failed quality check, score: ${qcResult.metrics.videoQualityScore}`);
      }
    }

    // Final step
    await jobRepository.updateStatus(jobId, 'processing', {
      currentStep: 'completed',
      stepProgress: 100,
      completedSteps: ['ingested', 'transcribing', 'detecting_highlights', 'planning_clips', 'subtitle_generation', 'rendering', 'metadata_generation', 'quality_check'],
    });

    await jobRepository.setResult(jobId, {
      videoId: jobId,
      clips: clips.map(c => ({ ...c, status: 'completed' as ClipStatus })),
    });

    console.log(`[Worker] Job ${jobId} completed successfully`);

  } catch (error) {
    console.error(`[Worker] Job ${jobId} failed:`, error);
    await jobRepository.setError(jobId, {
      code: 'JOB_PROCESSING_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error',
      step: 'processing',
      recoverable: true,
      details: { error: String(error) },
    });
    throw error;
  }
});

registerJobProcessor('transcribe', async (job) => {
  // Dedicated transcription job
  console.log(`[Worker] Transcription job ${job.id}`);
});

registerJobProcessor('generate_clips', async (job) => {
  // Dedicated clip generation job
  console.log(`[Worker] Clip generation job ${job.id}`);
});

registerJobProcessor('render_clip', async (job) => {
  // Dedicated clip rendering job
  console.log(`[Worker] Clip rendering job ${job.id}`);
});

registerJobProcessor('generate_subtitle', async (job) => {
  // Dedicated subtitle generation job
  console.log(`[Worker] Subtitle generation job ${job.id}`);
});

registerJobProcessor('generate_metadata', async (job) => {
  // Dedicated metadata generation job
  console.log(`[Worker] Metadata generation job ${job.id}`);
});

registerJobProcessor('quality_check', async (job) => {
  // Dedicated quality check job
  console.log(`[Worker] Quality check job ${job.id}`);
});

// Main worker loop
async function startWorker(): Promise<void> {
  console.log('Starting Auto Clipper Worker...');

  // Initialize database
  await initializeDatabase();
  console.log('Database initialized');

  // Initialize queue
  await initializeQueue();
  console.log('Queue initialized');

  // Print initial stats
  const stats = await getQueueStats();
  console.log('Queue stats:', stats);

  console.log('Worker started. Waiting for jobs...');

  // Keep alive
  setInterval(async () => {
    const stats = await getQueueStats();
    if (stats.waiting > 0 || stats.active > 0) {
      console.log(`Queue: ${stats.waiting} waiting, ${stats.active} active`);
    }
  }, 30000);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down worker...');
    await closeQueue();
    closeDatabase();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await closeQueue();
    closeDatabase();
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  startWorker().catch((error) => {
    console.error('Worker failed to start:', error);
    process.exit(1);
  });
}

export { startWorker };