// Job queue system using BullMQ (with Redis fallback to in-memory)

import { Queue, Worker, Job as BullJob, QueueEvents } from 'bullmq';
import { config } from '../config';
import { Job as JobType, JobType as JobTypeEnum, JobStatus } from '../types';
import { jobRepository } from '../database/repositories';
import { v4 as uuidv4 } from 'uuid';

let queue: Queue | null = null;
let queueEvents: QueueEvents | null = null;
let isRedisAvailable = false;

// In-memory fallback queue
interface QueuedJob {
  id: string;
  type: JobTypeEnum;
  data: any;
  priority: number;
  attempts: number;
  createdAt: Date;
}

const memoryQueue: QueuedJob[] = [];
const memoryProcessing = new Set<string>();
const memoryJobCallbacks = new Map<string, (job: QueuedJob) => Promise<void>>();

async function checkRedisConnection(): Promise<boolean> {
  if (!config.redisEnabled) return false;

  try {
    // Quick connection test - use dynamic import with type assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redisModule: any = await import('redis');
    const { createClient } = redisModule;
    const client = createClient({ url: config.redisUrl });
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch {
    return false;
  }
}

export async function initializeQueue(): Promise<void> {
  isRedisAvailable = await checkRedisConnection();

  if (isRedisAvailable) {
    try {
      const { Queue: BullQueue, QueueEvents: BullQueueEvents } = await import('bullmq');

      queue = new BullQueue('auto-clipper-jobs', {
        connection: { url: config.redisUrl },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      });

      queueEvents = new BullQueueEvents('auto-clipper-jobs', { connection: { url: config.redisUrl } });

      console.log('Job queue initialized with Redis');
      return;
    } catch (error) {
      console.warn('Failed to initialize Redis queue, falling back to memory:', error);
      isRedisAvailable = false;
    }
  }

  console.log('Job queue initialized with in-memory fallback');
}

export async function addJob(
  type: JobTypeEnum,
  data: any,
  options: { priority?: number; delay?: number; jobId?: string } = {}
): Promise<string> {
  const jobId = options.jobId || uuidv4();
  const priority = options.priority || 0;
  const delay = options.delay || 0;

  const jobData = { ...data, jobId, type };

  if (isRedisAvailable && queue) {
    await queue.add(type, jobData, { priority, delay, jobId });
    return jobId;
  }

  // In-memory fallback
  const queuedJob: QueuedJob = {
    id: jobId,
    type,
    data: jobData,
    priority,
    attempts: 0,
    createdAt: new Date(),
  };

  // Insert by priority (higher priority first)
  const insertIndex = memoryQueue.findIndex(j => j.priority < priority);
  if (insertIndex >= 0) {
    memoryQueue.splice(insertIndex, 0, queuedJob);
  } else {
    memoryQueue.push(queuedJob);
  }

  // Process after delay
  if (delay > 0) {
    setTimeout(() => processMemoryQueue(), delay);
  } else {
    processMemoryQueue();
  }

  return jobId;
}

export async function getJobStatus(jobId: string): Promise<{ status: JobStatus; progress?: number } | null> {
  if (isRedisAvailable && queue) {
    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const progress = job.progress as number | object;

    const statusMap: Record<string, JobStatus> = {
      waiting: 'queued',
      active: 'processing',
      completed: 'completed',
      failed: 'failed',
      delayed: 'queued',
      paused: 'queued',
    };

    return {
      status: statusMap[state] || 'queued',
      progress: typeof progress === 'number' ? progress : 0,
    };
  }

  // Check memory queue
  const queued = memoryQueue.find(j => j.id === jobId);
  if (queued) return { status: 'queued', progress: 0 };

  if (memoryProcessing.has(jobId)) return { status: 'processing', progress: 50 };

  // Check database
  const dbJob = await jobRepository.findById(jobId);
  if (dbJob) return { status: dbJob.status, progress: dbJob.progress.stepProgress };

  return null;
}

export async function cancelJob(jobId: string): Promise<boolean> {
  if (isRedisAvailable && queue) {
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      return true;
    }
  }

  // Remove from memory queue
  const index = memoryQueue.findIndex(j => j.id === jobId);
  if (index >= 0) {
    memoryQueue.splice(index, 1);
    return true;
  }

  return false;
}

export async function retryJob(jobId: string): Promise<boolean> {
  if (isRedisAvailable && queue) {
    const job = await queue.getJob(jobId);
    if (job && (await job.getState()) === 'failed') {
      await job.retry();
      return true;
    }
  }

  // For memory queue, re-add to queue
  const dbJob = await jobRepository.findById(jobId);
  if (dbJob && dbJob.status === 'failed') {
    await jobRepository.updateStatus(jobId, 'queued');
    await addJob(dbJob.type, dbJob.config, { jobId, priority: dbJob.priority });
    return true;
  }

  return false;
}

export function registerJobProcessor(type: JobTypeEnum, processor: (job: QueuedJob) => Promise<void>): void {
  memoryJobCallbacks.set(type, processor);
}

async function processMemoryQueue(): Promise<void> {
  if (memoryQueue.length === 0) return;

  // Check if we're already processing max concurrent jobs
  if (memoryProcessing.size >= 3) return;

  const job = memoryQueue.shift();
  if (!job) return;

  if (memoryProcessing.has(job.id)) return;

  memoryProcessing.add(job.id);
  job.attempts++;

  try {
    // Update database status
    await jobRepository.updateStatus(job.id, 'processing');

    const processor = memoryJobCallbacks.get(job.type);
    if (!processor) {
      throw new Error(`No processor registered for job type: ${job.type}`);
    }

    await processor(job);

    await jobRepository.updateStatus(job.id, 'completed');
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);

    if (job.attempts < 3) {
      // Re-queue with delay
      setTimeout(() => {
        memoryProcessing.delete(job.id);
        memoryQueue.unshift(job);
        processMemoryQueue();
      }, 5000 * job.attempts);
    } else {
      await jobRepository.updateStatus(job.id, 'failed');
      memoryProcessing.delete(job.id);
    }
  }

  memoryProcessing.delete(job.id);

  // Process next
  if (memoryQueue.length > 0) {
    processMemoryQueue();
  }
}

export async function getQueueStats(): Promise<{ waiting: number; active: number; completed: number; failed: number }> {
  if (isRedisAvailable && queue) {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }

  return {
    waiting: memoryQueue.length,
    active: memoryProcessing.size,
    completed: 0, // Would need to track separately
    failed: 0,
  };
}

export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
  if (queueEvents) {
    await queueEvents.close();
    queueEvents = null;
  }
}