// Security guardrails for filesystem, URL import, API keys, and MCP tools

import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

// Filesystem security
export class FilesystemGuard {
  private allowedPaths: string[] = [];
  private blockedPaths: string[] = [];
  private maxFileSize: number;

  constructor() {
    this.allowedPaths = config.allowedPaths.map(p => path.resolve(p));
    this.maxFileSize = config.maxFileSize;

    // Block sensitive system paths
    this.blockedPaths = [
      path.resolve('/etc'),
      path.resolve('/root'),
      path.resolve('/home'),
      path.resolve('C:\\Windows'),
      path.resolve('C:\\Program Files'),
      path.resolve('C:\\Users'),
      path.resolve(process.env.HOME || '~'),
      path.resolve(process.env.USERPROFILE || '~'),
    ].filter(p => fs.existsSync(p));
  }

  addAllowedPath(allowedPath: string): void {
    const resolved = path.resolve(allowedPath);
    if (!this.allowedPaths.includes(resolved)) {
      this.allowedPaths.push(resolved);
    }
  }

  addBlockedPath(blockedPath: string): void {
    const resolved = path.resolve(blockedPath);
    if (!this.blockedPaths.includes(resolved)) {
      this.blockedPaths.push(resolved);
    }
  }

  validatePath(requestedPath: string, operation: 'read' | 'write' | 'delete' = 'read'): { allowed: boolean; error?: string } {
    const resolved = path.resolve(requestedPath);

    // Check blocked paths first
    for (const blocked of this.blockedPaths) {
      if (resolved.startsWith(blocked)) {
        return { allowed: false, error: `Access denied: path is in blocked directory: ${blocked}` };
      }
    }

    // Check allowed paths
    let allowed = false;
    for (const allowedPath of this.allowedPaths) {
      if (resolved.startsWith(allowedPath)) {
        allowed = true;
        break;
      }
    }

    // Allow temp directory operations
    const tempDir = path.resolve(config.tempPath);
    if (resolved.startsWith(tempDir)) {
      allowed = true;
    }

    if (!allowed) {
      return { allowed: false, error: `Access denied: path not in allowed directories: ${resolved}` };
    }

    // Additional checks for write/delete
    if (operation === 'write' || operation === 'delete') {
      // Prevent writing to root of allowed paths
      for (const allowedPath of this.allowedPaths) {
        if (resolved === allowedPath) {
          return { allowed: false, error: `Cannot write directly to allowed root directory: ${allowedPath}` };
        }
      }
    }

    return { allowed: true };
  }

  validateFileSize(filePath: string): { allowed: boolean; error?: string } {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > this.maxFileSize) {
        return { allowed: false, error: `File size ${stats.size} exceeds maximum ${this.maxFileSize}` };
      }
      return { allowed: true };
    } catch {
      return { allowed: true }; // File doesn't exist yet, allow
    }
  }

  validateExtension(filePath: string, allowedExtensions: string[]): { allowed: boolean; error?: string } {
    const ext = path.extname(filePath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return { allowed: false, error: `File extension ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}` };
    }
    return { allowed: true };
  }
}

// URL import security
export class URLGuard {
  private allowedDomains: string[] = [];
  private blockedDomains: string[] = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '169.254.169.254', // AWS metadata
    'metadata.google.internal', // GCP metadata
  ];
  private allowedProtocols: string[] = ['https:', 'http:'];
  private maxRedirects = 5;
  private timeout = 30000;

  addAllowedDomain(domain: string): void {
    if (!this.allowedDomains.includes(domain)) {
      this.allowedDomains.push(domain);
    }
  }

  validateURL(urlString: string): { allowed: boolean; error?: string; url?: URL } {
    let url: URL;
    try {
      url = new URL(urlString);
    } catch {
      return { allowed: false, error: 'Invalid URL format' };
    }

    // Check protocol
    if (!this.allowedProtocols.includes(url.protocol)) {
      return { allowed: false, error: `Protocol ${url.protocol} not allowed` };
    }

    // Check blocked domains
    const hostname = url.hostname.toLowerCase();
    for (const blocked of this.blockedDomains) {
      if (hostname === blocked || hostname.endsWith('.' + blocked)) {
        return { allowed: false, error: `Domain ${hostname} is blocked` };
      }
    }

    // Check for private IP ranges
    if (this.isPrivateIP(hostname)) {
      return { allowed: false, error: 'Private IP addresses not allowed' };
    }

    // If allowed domains list is not empty, enforce it
    if (this.allowedDomains.length > 0) {
      let domainAllowed = false;
      for (const allowed of this.allowedDomains) {
        if (hostname === allowed || hostname.endsWith('.' + allowed)) {
          domainAllowed = true;
          break;
        }
      }
      if (!domainAllowed) {
        return { allowed: false, error: `Domain ${hostname} not in allowed list` };
      }
    }

    return { allowed: true, url };
  }

  private isPrivateIP(hostname: string): boolean {
    // Check if hostname is an IP address
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(hostname)) return false;

    const parts = hostname.split('.').map(Number);
    const [a, b] = parts;

    // Private ranges
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 127) return true; // Loopback
    if (a === 169 && b === 254) return true; // Link-local

    return false;
  }

  async fetchWithGuard(urlString: string, options: RequestInit = {}): Promise<Response> {
    const validation = this.validateURL(urlString);
    if (!validation.allowed) {
      throw new Error(validation.error);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(urlString, {
        ...options,
        signal: controller.signal,
        redirect: 'manual', // Handle redirects manually
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }
}

// API Key security
export class APIKeyGuard {
  private keys: Map<string, { key: string; provider: string; lastUsed: number; usageCount: number }> = new Map();
  private maxUsagePerHour = 1000;
  private keyRotationInterval = 24 * 60 * 60 * 1000; // 24 hours

  registerKey(provider: string, key: string): string {
    const keyId = uuidv4();
    this.keys.set(keyId, {
      key,
      provider,
      lastUsed: Date.now(),
      usageCount: 0,
    });
    return keyId;
  }

  getKey(keyId: string): string | null {
    const entry = this.keys.get(keyId);
    if (!entry) return null;

    // Check rotation
    if (Date.now() - entry.lastUsed > this.keyRotationInterval) {
      console.warn(`API key ${keyId} for ${entry.provider} is due for rotation`);
    }

    // Check usage limit
    if (entry.usageCount >= this.maxUsagePerHour) {
      console.warn(`API key ${keyId} for ${entry.provider} has exceeded hourly limit`);
      return null;
    }

    entry.lastUsed = Date.now();
    entry.usageCount++;
    return entry.key;
  }

  getKeyForProvider(provider: string): string | null {
    for (const [keyId, entry] of this.keys.entries()) {
      if (entry.provider === provider) {
        return this.getKey(keyId);
      }
    }
    return null;
  }

  revokeKey(keyId: string): boolean {
    return this.keys.delete(keyId);
  }

  rotateKey(keyId: string, newKey: string): boolean {
    const entry = this.keys.get(keyId);
    if (!entry) return false;

    entry.key = newKey;
    entry.usageCount = 0;
    entry.lastUsed = Date.now();
    return true;
  }

  getUsageStats(): Array<{ keyId: string; provider: string; usageCount: number; lastUsed: Date }> {
    return Array.from(this.keys.entries()).map(([keyId, entry]) => ({
      keyId,
      provider: entry.provider,
      usageCount: entry.usageCount,
      lastUsed: new Date(entry.lastUsed),
    }));
  }
}

// MCP Tool security
export class MCPToolGuard {
  private allowedTools: Set<string> = new Set();
  private blockedTools: Set<string> = new Set();
  private rateLimits: Map<string, { count: number; windowStart: number }> = new Map();
  private defaultRateLimit = 60; // requests per minute

  constructor() {
    // Default allowed tools
    this.allowedTools.add('process_video');
    this.allowedTools.add('get_job_status');
    this.allowedTools.add('cancel_job');
    this.allowedTools.add('retry_job');
    this.allowedTools.add('list_videos');
    this.allowedTools.add('get_video_info');
    this.allowedTools.add('get_queue_stats');
    this.allowedTools.add('get_settings');
    this.allowedTools.add('update_setting');
  }

  allowTool(toolName: string): void {
    this.allowedTools.add(toolName);
    this.blockedTools.delete(toolName);
  }

  blockTool(toolName: string): void {
    this.blockedTools.add(toolName);
    this.allowedTools.delete(toolName);
  }

  validateToolCall(toolName: string, params: any): { allowed: boolean; error?: string } {
    // Check if tool is blocked
    if (this.blockedTools.has(toolName)) {
      return { allowed: false, error: `Tool ${toolName} is blocked` };
    }

    // Check if tool is allowed (if allowlist is enforced)
    if (this.allowedTools.size > 0 && !this.allowedTools.has(toolName)) {
      return { allowed: false, error: `Tool ${toolName} is not in allowed list` };
    }

    // Rate limiting
    const now = Date.now();
    const minuteWindow = 60 * 1000;
    const key = `tool:${toolName}`;

    let limit = this.rateLimits.get(key);
    if (!limit || now - limit.windowStart > minuteWindow) {
      limit = { count: 0, windowStart: now };
      this.rateLimits.set(key, limit);
    }

    limit.count++;
    if (limit.count > this.defaultRateLimit) {
      return { allowed: false, error: `Rate limit exceeded for ${toolName}` };
    }

    // Parameter validation
    const paramValidation = this.validateParameters(toolName, params);
    if (!paramValidation.allowed) {
      return paramValidation;
    }

    return { allowed: true };
  }

  private validateParameters(toolName: string, params: any): { allowed: boolean; error?: string } {
    // Tool-specific parameter validation
    switch (toolName) {
      case 'process_video':
        if (!params.inputPath || typeof params.inputPath !== 'string') {
          return { allowed: false, error: 'inputPath is required and must be a string' };
        }
        if (params.config && typeof params.config !== 'object') {
          return { allowed: false, error: 'config must be an object' };
        }
        break;

      case 'get_job_status':
      case 'cancel_job':
      case 'retry_job':
        if (!params.jobId || typeof params.jobId !== 'string') {
          return { allowed: false, error: 'jobId is required and must be a string' };
        }
        break;

      case 'list_videos':
        if (params.limit && (typeof params.limit !== 'number' || params.limit > 100)) {
          return { allowed: false, error: 'limit must be a number <= 100' };
        }
        break;
    }

    return { allowed: true };
  }

  setRateLimit(toolName: string, requestsPerMinute: number): void {
    this.defaultRateLimit = requestsPerMinute;
  }

  getRateLimitStatus(toolName: string): { count: number; remaining: number; resetAt: Date } {
    const key = `tool:${toolName}`;
    const limit = this.rateLimits.get(key);
    const now = Date.now();

    if (!limit) {
      return { count: 0, remaining: this.defaultRateLimit, resetAt: new Date(now + 60000) };
    }

    return {
      count: limit.count,
      remaining: Math.max(0, this.defaultRateLimit - limit.count),
      resetAt: new Date(limit.windowStart + 60000),
    };
  }
}

// Input validation with Zod
import { z } from 'zod';

export const ProcessVideoInputSchema = z.object({
  inputPath: z.string().min(1),
  outputDir: z.string().optional(),
  config: z.object({
    targetDuration: z.number().min(5).max(300).optional(),
    maxClips: z.number().min(1).max(50).optional(),
    minClipDuration: z.number().min(5).max(60).optional(),
    maxClipDuration: z.number().min(10).max(300).optional(),
    aspectRatio: z.enum(['9:16', '16:9', '1:1']).optional(),
    language: z.string().optional(),
    qualityThreshold: z.number().min(0).max(1).optional(),
    enableViralScoring: z.boolean().optional(),
    customPrompt: z.string().max(5000).optional(),
  }).optional(),
});

export const JobStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const ListVideosInputSchema = z.object({
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ') };
}

// Export singleton instances
export const filesystemGuard = new FilesystemGuard();
export const urlGuard = new URLGuard();
export const apiKeyGuard = new APIKeyGuard();
export const mcpToolGuard = new MCPToolGuard();

// Initialize API keys from config
if (config.openaiApiKey) {
  apiKeyGuard.registerKey('openai', config.openaiApiKey);
}
if (config.anthropicApiKey) {
  apiKeyGuard.registerKey('anthropic', config.anthropicApiKey);
}
if (config.googleApiKey) {
  apiKeyGuard.registerKey('google', config.googleApiKey);
}