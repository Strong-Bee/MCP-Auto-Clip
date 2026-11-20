// Video ingestion service

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getVideoInfo, validateVideoFile, extractAudio } from './ffmpeg';
import { videoRepository } from '../database/repositories';
import { config } from '../config';
import { VideoMetadata, Job, JobType, JobStatus, JobConfig, JobProgress } from '../types';
import { jobRepository } from '../database/repositories';

export interface IngestionResult {
  video: VideoMetadata;
  job: Job;
  audioPath: string;
}

export async function ingestVideo(
  inputPath: string,
  options: Partial<JobConfig> = {}
): Promise<IngestionResult> {
  // Validate input file
  const validation = validateVideoFile(inputPath);
  if (!validation.valid) {
    throw new Error(`Invalid video file: ${validation.error}`);
  }

  // Get video info
  const videoInfo = await getVideoInfo(inputPath);

  // Check if video already exists in database
  let video = await videoRepository.findByPath(inputPath);

  if (!video) {
    // Create video record
    video = {
      id: uuidv4(),
      originalPath: inputPath,
      duration: videoInfo.duration,
      width: videoInfo.width,
      height: videoInfo.height,
      fps: videoInfo.fps,
      codec: videoInfo.videoCodec,
      bitrate: videoInfo.videoBitrate,
      fileSize: videoInfo.fileSize,
      format: videoInfo.format,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await videoRepository.create(video);
  }

  // Create processing job
  const jobConfig: JobConfig = {
    targetDuration: options.targetDuration || config.defaultTargetDuration,
    maxClips: options.maxClips || config.maxClipsPerJob,
    minClipDuration: options.minClipDuration || config.minClipDuration,
    maxClipDuration: options.maxClipDuration || config.maxClipDuration,
    aspectRatio: options.aspectRatio || config.defaultAspectRatio,
    language: options.language,
    providers: options.providers,
    subtitleStyle: options.subtitleStyle,
    qualityThreshold: options.qualityThreshold || config.qualityThreshold,
    enableViralScoring: options.enableViralScoring ?? config.enableViralScoring,
    customPrompt: options.customPrompt,
  };

  const jobProgress: JobProgress = {
    currentStep: 'ingested',
    stepProgress: 0,
    totalSteps: 7, // ingest, transcribe, highlights, plan, subtitle, render, metadata, qc
    completedSteps: ['ingested'],
  };

  const job: Job = {
    id: uuidv4(),
    type: 'process_video',
    status: 'queued',
    priority: 0,
    inputPath,
    outputDir: config.outputPath,
    config: jobConfig,
    progress: jobProgress,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await jobRepository.create(job);

  // Extract audio for transcription
  const audioDir = path.join(config.tempPath, 'audio', job.id);
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const audioPath = path.join(audioDir, `${video.id}.wav`);
  await extractAudio(inputPath, audioPath);

  return { video, job, audioPath };
}

export async function getVideoById(videoId: string): Promise<VideoMetadata | null> {
  // We need to add a findById method to videoRepository
  // For now, search all videos (not efficient but works for small datasets)
  const videos = await videoRepository.findAll();
  return videos.find(v => v.id === videoId) || null;
}

export async function listVideos(limit = 50, offset = 0): Promise<VideoMetadata[]> {
  const allVideos = await videoRepository.findAll();
  return allVideos.slice(offset, offset + limit);
}

export async function deleteVideo(videoId: string): Promise<boolean> {
  // Delete associated files
  const video = await getVideoById(videoId);
  if (video && fs.existsSync(video.originalPath)) {
    // Note: We don't auto-delete the original file for safety
    // But we can delete derived files
  }

  // Delete from database (cascades to related tables)
  return videoRepository.delete(videoId);
}