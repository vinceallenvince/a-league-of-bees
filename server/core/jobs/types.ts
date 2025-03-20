/**
 * Types for the job scheduler system
 */

/**
 * Job status enum
 */
export enum JobStatus {
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Job retry strategy
 */
export interface JobRetryStrategy {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

/**
 * Job configuration
 */
export interface JobConfig {
  id: string;
  name: string;
  description: string;
  schedule: string; // cron expression
  enabled: boolean;
  retryStrategy?: JobRetryStrategy;
  timeoutMs?: number;
  concurrency?: number;
}

/**
 * Job execution context
 */
export interface JobContext {
  jobId: string;
  startTime: Date;
  attempt: number;
  metadata: Record<string, any>;
}

/**
 * Job execution result
 */
export interface JobResult {
  success: boolean;
  error?: Error;
  data?: any;
  executionTimeMs: number;
}

/**
 * Job execution history entry
 */
export interface JobExecution {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: JobStatus;
  attempt: number;
  error?: string;
  result?: any;
}

/**
 * Job handler function type
 */
export type JobHandlerFn = (context: JobContext) => Promise<JobResult>;

/**
 * Registered job definition
 */
export interface RegisteredJob {
  config: JobConfig;
  handler: JobHandlerFn;
  lastExecution?: JobExecution;
  nextExecutionTime?: Date;
} 