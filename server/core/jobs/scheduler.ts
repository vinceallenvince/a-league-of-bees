import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';
import {
  JobConfig,
  JobContext,
  JobExecution,
  JobHandlerFn,
  JobResult,
  JobStatus,
  RegisteredJob
} from './types';

/**
 * Job scheduler service
 */
class JobScheduler {
  private jobs: Map<string, RegisteredJob> = new Map();
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private executionHistory: JobExecution[] = [];
  private isInitialized = false;

  /**
   * Initialize the job scheduler
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.warn('Job scheduler already initialized, skipping');
      return;
    }

    logger.info('Initializing job scheduler');
    this.isInitialized = true;

    // Restart scheduled tasks that are enabled
    this.restoreScheduledJobs();

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());

    logger.info('Job scheduler initialized');
  }

  /**
   * Register a new job
   */
  public registerJob(config: JobConfig, handler: JobHandlerFn): void {
    if (this.jobs.has(config.id)) {
      logger.warn(`Job with ID ${config.id} already registered, skipping`);
      return;
    }

    const job: RegisteredJob = {
      config,
      handler
    };

    this.jobs.set(config.id, job);
    logger.info(`Registered job: ${config.name} (${config.id})`);

    // Schedule the job if enabled
    if (config.enabled) {
      this.scheduleJob(config.id);
    }
  }

  /**
   * Schedule a job by ID
   */
  public scheduleJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.error(`Cannot schedule job with ID ${jobId}: Job not found`);
      return false;
    }

    // Cancel existing scheduled task if any
    this.cancelJob(jobId);

    try {
      // Validate cron expression
      if (!cron.validate(job.config.schedule)) {
        logger.error(`Invalid cron expression for job ${job.config.name} (${jobId}): ${job.config.schedule}`);
        return false;
      }

      // Schedule the job
      const task = cron.schedule(job.config.schedule, () => {
        this.executeJob(jobId)
          .catch(error => {
            logger.error(`Error executing job ${job.config.name} (${jobId})`, { error });
          });
      }, {
        scheduled: true,
        timezone: 'UTC'
      });

      this.tasks.set(jobId, task);
      
      // Calculate next execution time
      job.nextExecutionTime = this.getNextExecutionTime(job.config.schedule);
      
      logger.info(`Scheduled job: ${job.config.name} (${jobId}), next execution: ${job.nextExecutionTime}`);
      return true;
    } catch (error) {
      logger.error(`Error scheduling job ${job.config.name} (${jobId})`, { error });
      return false;
    }
  }

  /**
   * Cancel a scheduled job
   */
  public cancelJob(jobId: string): boolean {
    const task = this.tasks.get(jobId);
    if (task) {
      task.stop();
      this.tasks.delete(jobId);
      logger.info(`Cancelled scheduled job with ID ${jobId}`);
      return true;
    }
    return false;
  }

  /**
   * Execute a job immediately by ID
   */
  public async executeJob(jobId: string, metadata: Record<string, any> = {}): Promise<JobExecution> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Cannot execute job with ID ${jobId}: Job not found`);
    }

    const executionId = uuidv4();
    const startTime = new Date();
    const startTimestamp = Date.now();
    
    // Create execution record
    const execution: JobExecution = {
      id: executionId,
      jobId,
      startTime,
      status: JobStatus.RUNNING,
      attempt: 1
    };
    
    // Add to execution history
    this.executionHistory.push(execution);
    job.lastExecution = execution;

    // Create execution context
    const context: JobContext = {
      jobId,
      startTime,
      attempt: 1,
      metadata
    };

    logger.info(`Executing job: ${job.config.name} (${jobId})`, { executionId });

    try {
      const result = await Promise.race([
        job.handler(context),
        this.createTimeoutPromise(job.config.timeoutMs)
      ]);

      const executionTimeMs = Date.now() - startTimestamp;
      
      // Update execution record
      execution.endTime = new Date();
      execution.status = result.success ? JobStatus.COMPLETED : JobStatus.FAILED;
      execution.error = result.error?.message;
      execution.result = result.data;

      if (result.success) {
        logger.info(`Job completed successfully: ${job.config.name} (${jobId})`, { 
          executionId, 
          executionTimeMs 
        });
      } else {
        logger.error(`Job failed: ${job.config.name} (${jobId})`, { 
          executionId, 
          error: result.error, 
          executionTimeMs 
        });
      }

      return execution;
    } catch (error) {
      const executionTimeMs = Date.now() - startTimestamp;
      
      // Update execution record for failure
      execution.endTime = new Date();
      execution.status = JobStatus.FAILED;
      execution.error = error instanceof Error ? error.message : String(error);

      logger.error(`Error executing job ${job.config.name} (${jobId})`, { 
        executionId, 
        error, 
        executionTimeMs 
      });

      return execution;
    }
  }

  /**
   * Get job by ID
   */
  public getJob(jobId: string): RegisteredJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all registered jobs
   */
  public getAllJobs(): RegisteredJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get job execution history
   */
  public getExecutionHistory(jobId?: string, limit = 10): JobExecution[] {
    let history = [...this.executionHistory];
    
    if (jobId) {
      history = history.filter(execution => execution.jobId === jobId);
    }
    
    // Sort by start time descending (newest first)
    history.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    // Limit results
    return history.slice(0, limit);
  }

  /**
   * Shutdown the scheduler
   */
  public shutdown(): void {
    logger.info('Shutting down job scheduler');
    
    // Stop all scheduled tasks
    const taskIds = Array.from(this.tasks.keys());
    taskIds.forEach(jobId => {
      const task = this.tasks.get(jobId);
      if (task) {
        task.stop();
        logger.info(`Stopped scheduled job with ID ${jobId}`);
      }
    });
    
    this.tasks.clear();
    logger.info('Job scheduler shutdown complete');
  }

  /**
   * Restore scheduled jobs (used after initialization)
   */
  private restoreScheduledJobs(): void {
    const jobIds = Array.from(this.jobs.keys());
    jobIds.forEach(jobId => {
      const job = this.jobs.get(jobId);
      if (job && job.config.enabled) {
        this.scheduleJob(job.config.id);
      }
    });
  }

  /**
   * Create a promise that rejects after a timeout
   */
  private createTimeoutPromise(timeoutMs?: number): Promise<JobResult> {
    if (!timeoutMs) {
      // No timeout specified, create a promise that never resolves
      return new Promise<JobResult>(() => {});
    }

    return new Promise<JobResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Calculate the next execution time for a cron expression
   */
  private getNextExecutionTime(cronExpression: string): Date {
    try {
      const schedule = cron.schedule(cronExpression, () => {});
      schedule.stop();
      
      // @ts-ignore - Internal method but useful for getting next execution time
      const nextDate = schedule.getNextDate();
      return nextDate instanceof Date ? nextDate : new Date();
    } catch (error) {
      logger.error(`Error calculating next execution time for cron expression: ${cronExpression}`, { error });
      return new Date();
    }
  }
}

// Create singleton instance
export const jobScheduler = new JobScheduler();

export default jobScheduler; 