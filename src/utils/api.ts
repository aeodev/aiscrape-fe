/**
 * API Service Functions
 */

import axiosInstance from './axios';
import {
  ICreateScrapeJobRequest,
  IScrapeJobResponse,
  IScrapeListResponse,
} from '../types/scraper';

export const scraperAPI = {
  /**
   * Create a new scrape job
   */
  createJob: async (data: ICreateScrapeJobRequest): Promise<IScrapeJobResponse> => {
    const response = await axiosInstance.post('/api/scrape', data);
    return response.data;
  },

  /**
   * Get a specific job
   */
  getJob: async (jobId: string): Promise<IScrapeJobResponse> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      throw new Error('Invalid job ID');
    }
    const response = await axiosInstance.get(`/api/scrape/${jobId}`);
    return response.data;
  },

  /**
   * Get list of jobs
   */
  getJobs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    sessionId?: string;
  }): Promise<IScrapeListResponse> => {
    const response = await axiosInstance.get('/api/scrape', { params });
    return response.data;
  },

  /**
   * Delete a job
   */
  deleteJob: async (jobId: string): Promise<void> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      throw new Error('Invalid job ID');
    }
    await axiosInstance.delete(`/api/scrape/${jobId}`);
  },

  /**
   * Cancel a job
   */
  cancelJob: async (jobId: string): Promise<IScrapeJobResponse> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      throw new Error('Invalid job ID');
    }
    const response = await axiosInstance.post(`/api/scrape/${jobId}/cancel`);
    return response.data;
  },

  /**
   * Get statistics
   */
  getStats: async (): Promise<any> => {
    const response = await axiosInstance.get('/api/scrape/stats');
    return response.data;
  },
  /**
   * Chat with a job
   */
  chatWithJob: async (jobId: string, message: string): Promise<{ success: boolean; response: string; history: any[] }> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      throw new Error('Invalid job ID');
    }
    const response = await axiosInstance.post(`/api/scrape/${jobId}/chat`, { message });
    return response.data;
  },
  /**
   * Unified endpoint: Scrape and answer in one request
   */
  scrapeAndAnswer: async (input: string, options?: {
    scraperType?: string;
    useProxy?: boolean;
    blockResources?: boolean;
    includeScreenshots?: boolean;
  }): Promise<{ success: boolean; job?: any; response: string; url?: string; question?: string }> => {
    const response = await axiosInstance.post('/api/scrape/ask', {
      input,
      ...options,
    });
    return response.data;
  },
};


