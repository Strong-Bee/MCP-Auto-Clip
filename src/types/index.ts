// Core type definitions for MCP Auto Clipper

export interface VideoMetadata {
  id: string;
  originalPath: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  fileSize: number;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranscriptionSegment {
  id: string;
  jobId: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker?: string;
  language: string;
}

export interface TranscriptionResult {
  id: string;
  jobId: string;
  videoId: string;
  segments: TranscriptionSegment[];
  fullText: string;
  language: string;
  duration: number;
  provider: string;
  model: string;
  createdAt: Date;
}

export interface Highlight {
  id: string;
  jobId: string;
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  keywords: string[];
  transcriptSegmentIds: string[];
}

export interface ClipPlan {
  id: string;
  jobId: string;
  highlights: Highlight[];
  clips: ClipSpec[];
  totalDuration: number;
  estimatedRenderTime: number;
}

export interface ClipSpec {
  id: string;
  jobId: string;
  highlightId: string;
  startTime: number;
  endTime: number;
  duration: number;
  subtitlePath?: string;
  outputPath: string;
  status: ClipStatus;
  retryCount: number;
  error?: string;
  viralScore?: number;
  metadata?: ClipMetadata;
}

export type ClipStatus =
  | 'pending'
  | 'transcribing'
  | 'planning'
  | 'rendering'
  | 'generating_subtitle'
  | 'generating_metadata'
  | 'quality_check'
  | 'completed'
  | 'failed'
  | 'retrying';

export interface ClipMetadata {
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  category: string;
  viralScore: number;
  engagementPrediction: EngagementPrediction;
  thumbnailPath?: string;
}

export interface EngagementPrediction {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  retentionRate: number;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  inputPath: string;
  outputDir: string;
  config: JobConfig;
  progress: JobProgress;
  result?: JobResult;
  error?: JobError;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobType =
  | 'process_video'
  | 'transcribe'
  | 'generate_clips'
  | 'render_clip'
  | 'generate_subtitle'
  | 'generate_metadata'
  | 'quality_check';

export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export interface JobConfig {
  targetDuration?: number;
  maxClips?: number;
  minClipDuration?: number;
  maxClipDuration?: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  language?: string;
  providers?: AIProviderConfig[];
  subtitleStyle?: SubtitleStyle;
  qualityThreshold?: number;
  enableViralScoring?: boolean;
  customPrompt?: string;
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'nvidia' | 'local';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  priority: number;
  enabled: boolean;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  outlineColor: string;
  outlineWidth: number;
  backgroundColor?: string;
  backgroundOpacity: number;
  position: 'bottom' | 'top' | 'center';
  margin: number;
  animation?: 'fade' | 'slide' | 'pop' | 'none';
}

export interface JobProgress {
  currentStep: string;
  stepProgress: number;
  totalSteps: number;
  completedSteps: string[];
  currentClipIndex?: number;
  totalClips?: number;
}

export interface JobResult {
  videoId: string;
  clips: ClipSpec[];
  transcriptionId?: string;
  metadata?: ClipMetadata[];
  viralScores?: ViralScore[];
}

export interface JobError {
  code: string;
  message: string;
  step: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

export interface ViralScore {
  id: string;
  clipId: string;
  score: number;
  factors: ViralFactor[];
  prediction: EngagementPrediction;
}

export interface ViralFactor {
  name: string;
  weight: number;
  value: number;
  description: string;
}

export interface QualityCheckResult {
  id: string;
  clipId: string;
  passed: boolean;
  score: number;
  issues: QualityIssue[];
  metrics: QualityMetrics;
}

export interface QualityIssue {
  type: 'audio' | 'video' | 'subtitle' | 'sync' | 'format' | 'content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp?: number;
  autoFixable: boolean;
}

export interface QualityMetrics {
  videoBitrate: number;
  audioBitrate: number;
  resolution: { width: number; height: number };
  aspectRatio: string;
  duration: number;
  subtitleSyncOffset: number;
  audioLoudness: number;
  videoQualityScore: number;
}

export interface ProviderAdapter {
  name: string;
  transcribe(audioPath: string, config: TranscribeConfig): Promise<TranscriptionResult>;
  detectHighlights(transcription: TranscriptionResult, config: HighlightConfig): Promise<Highlight[]>;
  generateMetadata(clip: ClipSpec, transcription: TranscriptionResult, config: MetadataConfig): Promise<ClipMetadata>;
  scoreViral(clip: ClipSpec, metadata: ClipMetadata, config: ViralConfig): Promise<ViralScore>;
  isAvailable(): Promise<boolean>;
  getModels(): Promise<string[]>;
}

export interface TranscribeConfig {
  language?: string;
  model?: string;
  prompt?: string;
  temperature?: number;
}

export interface HighlightConfig {
  minDuration: number;
  maxDuration: number;
  targetCount: number;
  keywords?: string[];
  customPrompt?: string;
}

export interface MetadataConfig {
  style: 'viral' | 'educational' | 'entertainment' | 'news';
  platform: 'tiktok' | 'reels' | 'shorts' | 'generic';
  includeHashtags: boolean;
  maxTags: number;
}

export interface ViralConfig {
  platform: 'tiktok' | 'reels' | 'shorts' | 'generic';
  niche?: string;
  audience?: string;
}

export interface FFmpegInfo {
  ffmpegPath: string;
  ffprobePath: string;
  version: string;
}

export interface VideoInfo {
  path: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  videoBitrate: number;
  audioBitrate: number;
  format: string;
  fileSize: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

export interface RenderConfig {
  inputPath: string;
  outputPath: string;
  startTime: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoBitrate: string;
  audioBitrate: string;
  subtitlePath?: string;
  subtitleStyle?: SubtitleStyle;
  watermarkPath?: string;
  preset?: 'fast' | 'medium' | 'slow' | 'veryslow';
}

export interface DatabaseSchema {
  jobs: Job;
  videos: VideoMetadata;
  transcriptions: TranscriptionResult;
  clips: ClipSpec;
  highlights: Highlight;
  viralScores: ViralScore;
  qualityChecks: QualityCheckResult;
}