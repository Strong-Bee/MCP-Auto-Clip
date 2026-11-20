"use strict";
// Database configuration and initialization using sql.js (WASM inline version)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
exports.persistDatabase = persistDatabase;
exports.startAutoPersist = startAutoPersist;
exports.stopAutoPersist = stopAutoPersist;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const __dirname = path.dirname(module.filename);
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'autoclipper.sqlite');
// Use WASM inline version for Node.js
const SQL_WASM_INLINE_PATH = path.join(__dirname, '../../node_modules/sql.js/dist/sql-wasm-inline.js');
let dbInstance = null;
let isInitialized = false;
let SQL = null;
async function initializeDatabase(config) {
    if (isInitialized && dbInstance) {
        return dbInstance;
    }
    const finalConfig = {
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
    let db;
    if (fs.existsSync(finalConfig.path) && !finalConfig.readonly) {
        const fileBuffer = fs.readFileSync(finalConfig.path);
        db = new SQL.Database(fileBuffer);
    }
    else {
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
function getDatabase() {
    if (!dbInstance) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return dbInstance;
}
function closeDatabase() {
    if (dbInstance) {
        // Persist to disk
        const data = dbInstance.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
        dbInstance.close();
        dbInstance = null;
        isInitialized = false;
    }
}
function persistDatabase() {
    if (dbInstance) {
        const data = dbInstance.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
    }
}
// Auto-persist on interval
let persistInterval = null;
function startAutoPersist(intervalMs = 30000) {
    if (persistInterval)
        return;
    persistInterval = setInterval(() => {
        persistDatabase();
    }, intervalMs);
}
function stopAutoPersist() {
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
