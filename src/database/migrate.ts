// Database migration and schema setup

import { initializeDatabase, getDatabase, closeDatabase } from '../config/database';

const SCHEMA = `
-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 0,
  input_path TEXT NOT NULL,
  output_dir TEXT NOT NULL,
  config TEXT NOT NULL, -- JSON
  progress TEXT NOT NULL, -- JSON
  result TEXT, -- JSON
  error TEXT, -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  original_path TEXT NOT NULL UNIQUE,
  duration REAL NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  fps REAL NOT NULL,
  codec TEXT NOT NULL,
  bitrate INTEGER NOT NULL,
  file_size INTEGER NOT NULL,
  format TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_original_path ON videos(original_path);

-- Transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  video_id TEXT NOT NULL,
  segments TEXT NOT NULL, -- JSON array
  full_text TEXT NOT NULL,
  language TEXT NOT NULL,
  duration REAL NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_job_id ON transcriptions(job_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_video_id ON transcriptions(video_id);

-- Highlights table
CREATE TABLE IF NOT EXISTS highlights (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  score REAL NOT NULL,
  reason TEXT NOT NULL,
  keywords TEXT NOT NULL, -- JSON array
  transcript_segment_ids TEXT NOT NULL, -- JSON array
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_highlights_job_id ON highlights(job_id);

-- Clips table
CREATE TABLE IF NOT EXISTS clips (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  highlight_id TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  duration REAL NOT NULL,
  subtitle_path TEXT,
  output_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  viral_score REAL,
  metadata TEXT, -- JSON
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clips_job_id ON clips(job_id);
CREATE INDEX IF NOT EXISTS idx_clips_status ON clips(status);

-- Viral Scores table
CREATE TABLE IF NOT EXISTS viral_scores (
  id TEXT PRIMARY KEY,
  clip_id TEXT NOT NULL UNIQUE,
  score REAL NOT NULL,
  factors TEXT NOT NULL, -- JSON array
  prediction TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_viral_scores_clip_id ON viral_scores(clip_id);

-- Quality Checks table
CREATE TABLE IF NOT EXISTS quality_checks (
  id TEXT PRIMARY KEY,
  clip_id TEXT NOT NULL UNIQUE,
  passed INTEGER NOT NULL, -- 0 or 1
  score REAL NOT NULL,
  issues TEXT NOT NULL, -- JSON array
  metrics TEXT NOT NULL, -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY (clip_id) REFERENCES clips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quality_checks_clip_id ON quality_checks(clip_id);

-- Job Dependencies table (for workflow)
CREATE TABLE IF NOT EXISTS job_dependencies (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  depends_on_job_id TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_dependencies_job_id ON job_dependencies(job_id);
CREATE INDEX IF NOT EXISTS idx_job_dependencies_depends_on ON job_dependencies(depends_on_job_id);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'string', -- string, number, boolean, json
  description TEXT,
  updated_at TEXT NOT NULL
);
`;

async function migrate(): Promise<void> {
  console.log('Initializing database...');
  const db = await initializeDatabase();

  console.log('Running migrations...');

  // Execute schema statements
  const statements = SCHEMA.split(';').filter(s => s.trim().length > 0);

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed) {
      try {
        db.run(trimmed);
      } catch (error) {
        console.error('Migration error:', error);
        console.error('Statement:', trimmed);
        throw error;
      }
    }
  }

  // Insert default settings
  const defaultSettings = [
    { key: 'ffmpeg_path', value: '', type: 'string', description: 'Path to FFmpeg binary' },
    { key: 'ffprobe_path', value: '', type: 'string', description: 'Path to FFprobe binary' },
    { key: 'default_aspect_ratio', value: '9:16', type: 'string', description: 'Default output aspect ratio' },
    { key: 'default_target_duration', value: '60', type: 'number', description: 'Default target clip duration in seconds' },
    { key: 'max_clips_per_job', value: '10', type: 'number', description: 'Maximum clips per job' },
    { key: 'min_clip_duration', value: '15', type: 'number', description: 'Minimum clip duration in seconds' },
    { key: 'max_clip_duration', value: '120', type: 'number', description: 'Maximum clip duration in seconds' },
    { key: 'quality_threshold', value: '0.7', type: 'number', description: 'Quality check threshold (0-1)' },
    { key: 'enable_viral_scoring', value: 'true', type: 'boolean', description: 'Enable viral scoring' },
    { key: 'max_retry_attempts', value: '2', type: 'number', description: 'Maximum retry attempts per clip' },
    { key: 'subtitle_font_family', value: 'Arial', type: 'string', description: 'Default subtitle font family' },
    { key: 'subtitle_font_size', value: '24', type: 'number', description: 'Default subtitle font size' },
    { key: 'subtitle_font_color', value: '#FFFFFF', type: 'string', description: 'Default subtitle font color' },
    { key: 'subtitle_outline_color', value: '#000000', type: 'string', description: 'Default subtitle outline color' },
    { key: 'subtitle_outline_width', value: '2', type: 'number', description: 'Default subtitle outline width' },
    { key: 'subtitle_position', value: 'bottom', type: 'string', description: 'Default subtitle position' },
    { key: 'subtitle_margin', value: '50', type: 'number', description: 'Default subtitle margin from edge' },
  ];

  const now = new Date().toISOString();
  for (const setting of defaultSettings) {
    try {
      db.run(
        `INSERT OR IGNORE INTO settings (key, value, type, description, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [setting.key, setting.value, setting.type, setting.description, now]
      );
    } catch (error) {
      console.warn(`Failed to insert setting ${setting.key}:`, error);
    }
  }

  console.log('Migrations completed successfully');
  closeDatabase();
}

// Run migration if executed directly
if (require.main === module) {
  migrate().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export { migrate, SCHEMA };