import { Request, Response } from 'express';
import { jobScheduler } from './scheduler';
import logger from '../logger';

/**
 * Job Controller for API endpoints
 */
export const jobController = {
  /**
   * Get all registered jobs
   */
  getAllJobs: (req: Request, res: Response) => {
    try {
      const jobs = jobScheduler.getAllJobs().map(job => ({
        id: job.config.id,
        name: job.config.name,
        description: job.config.description,
        schedule: job.config.schedule,
        enabled: job.config.enabled,
        nextExecutionTime: job.nextExecutionTime,
        lastExecution: job.lastExecution ? {
          id: job.lastExecution.id,
          startTime: job.lastExecution.startTime,
          endTime: job.lastExecution.endTime,
          status: job.lastExecution.status,
        } : null
      }));
      
      res.json(jobs);
    } catch (error) {
      logger.error('Error getting all jobs', { error });
      res.status(500).json({ error: 'Failed to get jobs' });
    }
  },
  
  /**
   * Get job by ID
   */
  getJobById: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const job = jobScheduler.getJob(id);
      
      if (!job) {
        return res.status(404).json({ error: `Job with ID ${id} not found` });
      }
      
      res.json({
        id: job.config.id,
        name: job.config.name,
        description: job.config.description,
        schedule: job.config.schedule,
        enabled: job.config.enabled,
        nextExecutionTime: job.nextExecutionTime,
        lastExecution: job.lastExecution ? {
          id: job.lastExecution.id,
          startTime: job.lastExecution.startTime,
          endTime: job.lastExecution.endTime,
          status: job.lastExecution.status,
        } : null
      });
    } catch (error) {
      logger.error('Error getting job by ID', { error });
      res.status(500).json({ error: 'Failed to get job details' });
    }
  },
  
  /**
   * Get job execution history
   */
  getJobHistory: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      // If ID is provided, get history for specific job
      const history = id ? 
        jobScheduler.getExecutionHistory(id, limit) : 
        jobScheduler.getExecutionHistory(undefined, limit);
      
      res.json(history);
    } catch (error) {
      logger.error('Error getting job execution history', { error });
      res.status(500).json({ error: 'Failed to get job execution history' });
    }
  },
  
  /**
   * Manually execute a job
   */
  executeJob: (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const metadata = req.body?.metadata || {};
      
      // Check if job exists
      const job = jobScheduler.getJob(id);
      if (!job) {
        return res.status(404).json({ error: `Job with ID ${id} not found` });
      }
      
      // Execute job asynchronously
      jobScheduler.executeJob(id, metadata)
        .then(execution => {
          logger.info(`Manually triggered job execution for ${job.config.name} (${id})`, { 
            executionId: execution.id 
          });
        })
        .catch(error => {
          logger.error(`Error in manually triggered job execution for ${job.config.name} (${id})`, { error });
        });
      
      // Immediately return response that job was triggered
      res.status(202).json({ 
        message: `Job ${job.config.name} (${id}) execution triggered`,
        jobId: id
      });
    } catch (error) {
      logger.error('Error executing job', { error });
      res.status(500).json({ error: 'Failed to execute job' });
    }
  }
}; 