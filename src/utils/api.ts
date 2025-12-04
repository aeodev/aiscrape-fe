import axiosInstance from '@/utils/axios.instance'
import {
  GET_SCRAPE_JOBS,
  GET_SCRAPE_JOB,
  CREATE_SCRAPE_JOB,
  DELETE_SCRAPE_JOB,
  CANCEL_SCRAPE_JOB,
  SCRAPE_STATS,
  CHAT_WITH_JOB,
  SCRAPE_AND_ANSWER,
} from '@/utils/api.routes'
import type { ICreateScrapeJobRequest, IScrapeJobResponse, IScrapeListResponse } from '@/types/scraper'

export const scraperAPI = {
  createJob: async (data: ICreateScrapeJobRequest): Promise<IScrapeJobResponse> => {
    const response = await axiosInstance.post(CREATE_SCRAPE_JOB(), data)
    return response.data
  },

  getJob: async (jobId: string): Promise<IScrapeJobResponse> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') throw new Error('Invalid job ID')
    const response = await axiosInstance.get(GET_SCRAPE_JOB(jobId))
    return response.data
  },

  getJobs: async (params?: { page?: number; limit?: number; status?: string; sessionId?: string }): Promise<IScrapeListResponse> => {
    const response = await axiosInstance.get(GET_SCRAPE_JOBS(), { params })
    return response.data
  },

  deleteJob: async (jobId: string): Promise<void> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') throw new Error('Invalid job ID')
    await axiosInstance.delete(DELETE_SCRAPE_JOB(jobId))
  },

  cancelJob: async (jobId: string): Promise<IScrapeJobResponse> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') throw new Error('Invalid job ID')
    const response = await axiosInstance.post(CANCEL_SCRAPE_JOB(jobId))
    return response.data
  },

  getStats: async (): Promise<unknown> => {
    const response = await axiosInstance.get(SCRAPE_STATS())
    return response.data
  },

  chatWithJob: async (jobId: string, message: string): Promise<{ success: boolean; response: string; history: unknown[] }> => {
    if (!jobId || jobId === 'undefined' || jobId === 'null') throw new Error('Invalid job ID')
    const response = await axiosInstance.post(CHAT_WITH_JOB(jobId), { message })
    return response.data
  },

  scrapeAndAnswer: async (
    input: string,
    options?: { scraperType?: string; useProxy?: boolean; blockResources?: boolean; includeScreenshots?: boolean }
  ): Promise<{ success: boolean; job?: unknown; response: string; url?: string; question?: string }> => {
    const response = await axiosInstance.post(SCRAPE_AND_ANSWER(), { input, ...options })
    return response.data
  },
}
