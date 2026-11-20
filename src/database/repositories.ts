// Database repositories for all entities

import { getDatabase, initializeDatabase, persistDatabase, SqlJsDatabase } from '../config/database';
import {
  Job,
  JobStatus,
  JobType,
  VideoMetadata,
  TranscriptionResult,
  Highlight,
  ClipSpec,
  ClipStatus,
  ViralScore,
  QualityCheckResult,
  JobConfig,
  JobProgress,
  JobResult,
  JobError,
} from '../types';

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

// Generic repository base
abstract class BaseRepository<T> {
  protected db: SqlJsDatabase | null = null;
  protected tableName: string;
  protected rowMapper: (row: any) => T;

  constructor(tableName: string, rowMapper: (row: any) => T) {
    this.tableName = tableName;
    this.rowMapper = rowMapper;
  }

  protected getDb(): SqlJsDatabase {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  protected async ensureDb(): Promise<void> {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
  }

  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<T> {
    await this.ensureDb();
    const id = entity.id || generateId();
    const createdAt = nowISO();
    const updatedAt = createdAt;

    const columns = Object.keys(entity).filter(k => k !== 'id').join(', ');
    const placeholders = Object.keys(entity).filter(k => k !== 'id').map(() => '?').join(', ');
    const values = Object.entries(entity).filter(([k]) => k !== 'id').map(([, v]) => v);

    const db = this.getDb();
    db.run(
      `INSERT INTO ${this.tableName} (id, ${columns}, created_at, updated_at) VALUES (?, ${placeholders}, ?, ?)`,
      [id, ...values, createdAt, updatedAt]
    );

    persistDatabase();
    return this.findById(id) as Promise<T>;
  }

  async findById(id: string): Promise<T | null> {
    await this.ensureDb();
    const db = this.getDb();
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    stmt.bind([id]);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result ? this.rowMapper(result) : null;
  }

  async findAll(whereClause = '', params: any[] = []): Promise<T[]> {
    await this.ensureDb();
    const db = this.getDb();
    const sql = `SELECT * FROM ${this.tableName} ${whereClause}`;
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(this.rowMapper(stmt.getAsObject()));
    }
    stmt.free();
    return results;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    await this.ensureDb();
    const db = this.getDb();
    const setClause = Object.keys(updates).map(k => `${this.camelToSnake(k)} = ?`).join(', ');
    const values = Object.values(updates);

    if (setClause) {
      db.run(
        `UPDATE ${this.tableName} SET ${setClause}, updated_at = ? WHERE id = ?`,
        [...values, nowISO(), id]
      );
      persistDatabase();
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await this.ensureDb();
    const db = this.getDb();
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    stmt.bind([id]);
    stmt.step();
    const changes = db.getRowsModified();
    stmt.free();
    persistDatabase();
    return changes > 0;
  }

  async count(whereClause = '', params: any[] = []): Promise<number> {
    await this.ensureDb();
    const db = this.getDb();
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const stmt = db.prepare(sql);
    stmt.bind(params);
    let count = 0;
    if (stmt.step()) {
      count = stmt.getAsObject().count as number;
    }
    stmt.free();
    return count;
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

// Job Repository
function mapJob(row: any): Job {
  return {
    id: row.id,
    type: row.type as JobType,
    status: row.status as JobStatus,
    priority: row.priority,
    inputPath: row.input_path,
    outputDir: row.output_dir,
    config: JSON.parse(row.config),
    progress: JSON.parse(row.progress),
    result: row.result ? JSON.parse(row.result) : undefined,
    error: row.error ? JSON.parse(row.error) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export class JobRepository extends BaseRepository<Job> {
  constructor() {
    super('jobs', mapJob);
  }

  async findByStatus(status: JobStatus): Promise<Job[]> {
    return this.findAll('WHERE status = ? ORDER BY priority DESC, created_at ASC', [status]);
  }

  async findByType(type: JobType): Promise<Job[]> {
    return this.findAll('WHERE type = ? ORDER BY created_at DESC', [type]);
  }

  async findPending(limit = 10): Promise<Job[]> {
    return this.findAll('WHERE status = ? ORDER BY priority DESC, created_at ASC LIMIT ?', ['queued', limit]);
  }

  async updateStatus(id: string, status: JobStatus, progress?: Partial<JobProgress>): Promise<Job | null> {
    const updates: Partial<Job> = { status, updatedAt: new Date() };
    if (status === 'processing' && !updates.startedAt) {
      updates.startedAt = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      updates.completedAt = new Date();
    }
    if (progress) {
      const job = await this.findById(id);
      if (job) {
        updates.progress = { ...job.progress, ...progress };
      }
    }
    return this.update(id, updates);
  }

  async setResult(id: string, result: JobResult): Promise<Job | null> {
    return this.update(id, { result, status: 'completed', completedAt: new Date() });
  }

  async setError(id: string, error: JobError): Promise<Job | null> {
    return this.update(id, { error, status: 'failed', completedAt: new Date() });
  }
}

// Video Repository
function mapVideo(row: any): VideoMetadata {
  return {
    id: row.id,
    originalPath: row.original_path,
    duration: row.duration,
    width: row.width,
    height: row.height,
    fps: row.fps,
    codec: row.codec,
    bitrate: row.bitrate,
    fileSize: row.file_size,
    format: row.format,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class VideoRepository extends BaseRepository<VideoMetadata> {
  constructor() {
    super('videos', mapVideo);
  }

  async findByPath(path: string): Promise<VideoMetadata | null> {
    const results = await this.findAll('WHERE original_path = ?', [path]);
    return results[0] || null;
  }
}

// Transcription Repository
function mapTranscription(row: any): TranscriptionResult {
  return {
    id: row.id,
    jobId: row.job_id,
    videoId: row.video_id,
    segments: JSON.parse(row.segments),
    fullText: row.full_text,
    language: row.language,
    duration: row.duration,
    provider: row.provider,
    model: row.model,
    createdAt: new Date(row.created_at),
  };
}

export class TranscriptionRepository extends BaseRepository<TranscriptionResult> {
  constructor() {
    super('transcriptions', mapTranscription);
  }

  async findByJobId(jobId: string): Promise<TranscriptionResult | null> {
    const results = await this.findAll('WHERE job_id = ?', [jobId]);
    return results[0] || null;
  }

  async findByVideoId(videoId: string): Promise<TranscriptionResult[]> {
    return this.findAll('WHERE video_id = ?', [videoId]);
  }
}

// Highlight Repository
function mapHighlight(row: any): Highlight {
  return {
    id: row.id,
    jobId: row.job_id,
    startTime: row.start_time,
    endTime: row.end_time,
    score: row.score,
    reason: row.reason,
    keywords: JSON.parse(row.keywords),
    transcriptSegmentIds: JSON.parse(row.transcript_segment_ids),
  };
}

export class HighlightRepository extends BaseRepository<Highlight> {
  constructor() {
    super('highlights', mapHighlight);
  }

  async findByJobId(jobId: string): Promise<Highlight[]> {
    return this.findAll('WHERE job_id = ? ORDER BY score DESC', [jobId]);
  }

  async createBatch(highlights: Omit<Highlight, 'id'>[]): Promise<Highlight[]> {
    const results: Highlight[] = [];
    for (const h of highlights) {
      results.push(await this.create(h as any));
    }
    return results;
  }
}

// Clip Repository
function mapClip(row: any): ClipSpec {
  return {
    id: row.id,
    jobId: row.job_id,
    highlightId: row.highlight_id,
    startTime: row.start_time,
    endTime: row.end_time,
    duration: row.duration,
    subtitlePath: row.subtitle_path || undefined,
    outputPath: row.output_path,
    status: row.status as ClipStatus,
    retryCount: row.retry_count,
    error: row.error || undefined,
    viralScore: row.viral_score || undefined,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  };
}

export class ClipRepository extends BaseRepository<ClipSpec> {
  constructor() {
    super('clips', mapClip);
  }

  async findByJobId(jobId: string): Promise<ClipSpec[]> {
    return this.findAll('WHERE job_id = ? ORDER BY start_time ASC', [jobId]);
  }

  async findByStatus(status: ClipStatus): Promise<ClipSpec[]> {
    return this.findAll('WHERE status = ?', [status]);
  }

  async findPendingClips(limit = 10): Promise<ClipSpec[]> {
    return this.findAll('WHERE status = ? ORDER BY created_at ASC LIMIT ?', ['pending', limit]);
  }

  async updateStatus(id: string, status: ClipStatus, error?: string): Promise<ClipSpec | null> {
    const updates: Partial<ClipSpec> = { status };
    if (error) updates.error = error;
    if (status === 'retrying') {
      const clip = await this.findById(id);
      if (clip) updates.retryCount = clip.retryCount + 1;
    }
    return this.update(id, updates);
  }

  async setViralScore(id: string, viralScore: number): Promise<ClipSpec | null> {
    return this.update(id, { viralScore });
  }

  async setMetadata(id: string, metadata: any): Promise<ClipSpec | null> {
    return this.update(id, { metadata });
  }
}

// Viral Score Repository
function mapViralScore(row: any): ViralScore {
  return {
    id: row.id,
    clipId: row.clip_id,
    score: row.score,
    factors: JSON.parse(row.factors),
    prediction: JSON.parse(row.prediction),
  };
}

export class ViralScoreRepository extends BaseRepository<ViralScore> {
  constructor() {
    super('viral_scores', mapViralScore);
  }

  async findByClipId(clipId: string): Promise<ViralScore | null> {
    const results = await this.findAll('WHERE clip_id = ?', [clipId]);
    return results[0] || null;
  }
}

// Quality Check Repository
function mapQualityCheck(row: any): QualityCheckResult {
  return {
    id: row.id,
    clipId: row.clip_id,
    passed: row.passed === 1,
    score: row.score,
    issues: JSON.parse(row.issues),
    metrics: JSON.parse(row.metrics),
  };
}

export class QualityCheckRepository extends BaseRepository<QualityCheckResult> {
  constructor() {
    super('quality_checks', mapQualityCheck);
  }

  async findByClipId(clipId: string): Promise<QualityCheckResult | null> {
    const results = await this.findAll('WHERE clip_id = ?', [clipId]);
    return results[0] || null;
  }
}

// Settings Repository
export class SettingsRepository {
  private db: SqlJsDatabase | null = null;

  private getDb(): SqlJsDatabase {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  private async ensureDb(): Promise<void> {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    await this.ensureDb();
    const db = this.getDb();
    const stmt = db.prepare('SELECT value, type FROM settings WHERE key = ?');
    stmt.bind([key]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      const value = row.value as string;
      const type = row.type as string;
      return this.parseValue(value, type) as T;
    }
    stmt.free();
    return defaultValue;
  }

  async set(key: string, value: any, type?: string): Promise<void> {
    await this.ensureDb();
    const db = this.getDb();
    const inferredType = type || this.inferType(value);
    const serialized = this.serializeValue(value, inferredType);

    db.run(
      `INSERT OR REPLACE INTO settings (key, value, type, updated_at) VALUES (?, ?, ?, ?)`,
      [key, serialized, inferredType, nowISO()]
    );
    persistDatabase();
  }

  async getAll(): Promise<Record<string, any>> {
    await this.ensureDb();
    const db = this.getDb();
    const results = await db.exec('SELECT key, value, type FROM settings');
    const settings: Record<string, any> = {};
    if (results[0]) {
      for (const row of results[0].values) {
        settings[row[0] as string] = this.parseValue(row[1] as string, row[2] as string);
      }
    }
    return settings;
  }

  private inferType(value: any): string {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  private serializeValue(value: any, type: string): string {
    switch (type) {
      case 'boolean':
        return value ? '1' : '0';
      case 'number':
        return String(value);
      case 'json':
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'boolean':
        return value === '1' || value === 'true';
      case 'number':
        return Number(value);
      case 'json':
        try { return JSON.parse(value); } catch { return value; }
      default:
        return value;
    }
  }
}

// Lazy-initialized singleton instances
let _jobRepository: JobRepository | null = null;
let _videoRepository: VideoRepository | null = null;
let _transcriptionRepository: TranscriptionRepository | null = null;
let _highlightRepository: HighlightRepository | null = null;
let _clipRepository: ClipRepository | null = null;
let _viralScoreRepository: ViralScoreRepository | null = null;
let _qualityCheckRepository: QualityCheckRepository | null = null;
let _settingsRepository: SettingsRepository | null = null;

export function getJobRepository(): JobRepository {
  if (!_jobRepository) _jobRepository = new JobRepository();
  return _jobRepository;
}

export function getVideoRepository(): VideoRepository {
  if (!_videoRepository) _videoRepository = new VideoRepository();
  return _videoRepository;
}

export function getTranscriptionRepository(): TranscriptionRepository {
  if (!_transcriptionRepository) _transcriptionRepository = new TranscriptionRepository();
  return _transcriptionRepository;
}

export function getHighlightRepository(): HighlightRepository {
  if (!_highlightRepository) _highlightRepository = new HighlightRepository();
  return _highlightRepository;
}

export function getClipRepository(): ClipRepository {
  if (!_clipRepository) _clipRepository = new ClipRepository();
  return _clipRepository;
}

export function getViralScoreRepository(): ViralScoreRepository {
  if (!_viralScoreRepository) _viralScoreRepository = new ViralScoreRepository();
  return _viralScoreRepository;
}

export function getQualityCheckRepository(): QualityCheckRepository {
  if (!_qualityCheckRepository) _qualityCheckRepository = new QualityCheckRepository();
  return _qualityCheckRepository;
}

export function getSettingsRepository(): SettingsRepository {
  if (!_settingsRepository) _settingsRepository = new SettingsRepository();
  return _settingsRepository;
}

// Backward compatibility - these will initialize on first access
export const jobRepository = new Proxy({} as JobRepository, {
  get(target, prop) {
    return getJobRepository()[prop as keyof JobRepository];
  },
});

export const videoRepository = new Proxy({} as VideoRepository, {
  get(target, prop) {
    return getVideoRepository()[prop as keyof VideoRepository];
  },
});

export const transcriptionRepository = new Proxy({} as TranscriptionRepository, {
  get(target, prop) {
    return getTranscriptionRepository()[prop as keyof TranscriptionRepository];
  },
});

export const highlightRepository = new Proxy({} as HighlightRepository, {
  get(target, prop) {
    return getHighlightRepository()[prop as keyof HighlightRepository];
  },
});

export const clipRepository = new Proxy({} as ClipRepository, {
  get(target, prop) {
    return getClipRepository()[prop as keyof ClipRepository];
  },
});

export const viralScoreRepository = new Proxy({} as ViralScoreRepository, {
  get(target, prop) {
    return getViralScoreRepository()[prop as keyof ViralScoreRepository];
  },
});

export const qualityCheckRepository = new Proxy({} as QualityCheckRepository, {
  get(target, prop) {
    return getQualityCheckRepository()[prop as keyof QualityCheckRepository];
  },
});

export const settingsRepository = new Proxy({} as SettingsRepository, {
  get(target, prop) {
    return getSettingsRepository()[prop as keyof SettingsRepository];
  },
});