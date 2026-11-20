// Database configuration and initialization using sql.js (WASM inline version)

import * as fs from 'fs';
import * as path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'autoclipper.sqlite');
// Use WASM inline version for Node.js
const SQL_WASM_INLINE_PATH = path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm-inline.js');

export interface DatabaseConfig {
  path: string;
  wasmPath: string;
  readonly?: boolean;
  fileMustExist?: boolean;
}

export type SqlJsDatabase = any;
export type SqlJsStatic = any;

let dbInstance: SqlJsDatabase | null = null;
let isInitialized = false;
let SQL: SqlJsStatic | null = null;

export async function initializeDatabase(config?: Partial<DatabaseConfig>): Promise<SqlJsDatabase> {
  if (isInitialized && dbInstance) {
    return dbInstance;
  }

  const finalConfig: DatabaseConfig = {
    path: config?.path || DB_PATH,
    wasmPath: config?.wasmPath || SQL_WASM_INLINE_PATH,
    readonly: config?.readonly || false,
    fileMustExist: config?.fileMustExist || false,
  };

  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Load SQL.js (WASM inline - async initialization)
  if (!SQL) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sqlJsModule = require(finalConfig.wasmPath);
    SQL = await sqlJsModule();
  }

  // Load existing database or create new
  let db: SqlJsDatabase;
  if (fs.existsSync(finalConfig.path) && !finalConfig.readonly) {
    const fileBuffer = fs.readFileSync(finalConfig.path);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  dbInstance = db;
  isInitialized = true;

  // Enable foreign keys and optimize
  db.run('PRAGMA foreign_keys = ON;');
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA synchronous = NORMAL;');
  db.run('PRAGMA cache_size = 10000;');
  db.run('PRAGMA temp_store = MEMORY;');

  return db;
}

export function getDatabase(): SqlJsDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    // Persist to disk
    const data = dbInstance.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    dbInstance.close();
    dbInstance = null;
    isInitialized = false;
  }
}

export function persistDatabase(): void {
  if (dbInstance) {
    const data = dbInstance.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Auto-persist on interval
let persistInterval: NodeJS.Timeout | null = null;
export function startAutoPersist(intervalMs = 30000): void {
  if (persistInterval) return;
  persistInterval = setInterval(() => {
    persistDatabase();
  }, intervalMs);
}

export function stopAutoPersist(): void {
  if (persistInterval) {
    clearInterval(persistInterval);
    persistInterval = null;
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

process.on('beforeExit', () => {
  closeDatabase();
});