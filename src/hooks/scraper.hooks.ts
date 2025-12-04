import { useCallback, useState, useEffect } from 'react'
import axiosInstance from '@/utils/axios.instance'
import { useScraperStore } from '@/stores/scraper.store'
import {
  GET_SCRAPE_JOBS,
  GET_SCRAPE_JOB,
  CHAT_WITH_JOB,
  SCRAPE_AND_ANSWER,
} from '@/utils/api.routes'
import { getOrCreateSessionId } from '@/utils/session'
import type { IScrapeJob, ScraperType } from '@/types/scraper'

type Errors = {
  message: string | string[]
  statusCode?: number
}

function normalizeError(error: unknown): Errors {
  if (typeof error === 'string') return { message: error }
  if (error && typeof error === 'object') {
    const anyError = error as Record<string, unknown>
    if ('response' in anyError && anyError.response && typeof anyError.response === 'object') {
      const response = anyError.response as Record<string, unknown>
      const data = response.data as Record<string, unknown> | undefined
      const status = response.status as number | undefined
      if (data) {
        const message = (data.message as string) ?? (data.error as string) ?? 'Request failed'
        return { message, statusCode: status }
      }
      return { message: `Request failed with status ${status ?? 'unknown'}`, statusCode: status }
    }
    if ('message' in anyError && typeof anyError.message === 'string') {
      return { message: anyError.message }
    }
  }
  return { message: 'Something went wrong' }
}

export const useScraperJobs = () => {
  const [data, setData] = useState<IScrapeJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Errors | null>(null)
  const setJobs = useScraperStore((state) => state.setJobs)

  const fetchJobs = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const sessionId = getOrCreateSessionId()
      const response = await axiosInstance.get<{ success: boolean; jobs: IScrapeJob[] }>(GET_SCRAPE_JOBS(), {
        params: { sessionId },
      })
      const jobs = response.data.jobs || []
      setData(jobs)
      setJobs(jobs)
    } catch (err) {
      setError(normalizeError(err))
    } finally {
      setLoading(false)
    }
  }, [setJobs])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return { data, loading, error, fetchJobs }
}

export const useScraperJob = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Errors | null>(null)
  const updateJob = useScraperStore((state) => state.updateJob)
  const addJob = useScraperStore((state) => state.addJob)

  const fetchJob = useCallback(async (jobId: string): Promise<IScrapeJob | null> => {
    if (!jobId || jobId === 'undefined') return null
    setError(null)
    setLoading(true)
    try {
      const response = await axiosInstance.get<{ success: boolean; job: IScrapeJob }>(GET_SCRAPE_JOB(jobId))
      const job = response.data.job
      if (job) {
        const exists = useScraperStore.getState().jobs.find((j) => j._id === job._id)
        if (exists) updateJob(job._id, job)
        else addJob(job)
      }
      return job || null
    } catch (err) {
      setError(normalizeError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [updateJob, addJob])

  return { fetchJob, loading, error }
}

export const useScrapeAndAnswer = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Errors | null>(null)
  const addJob = useScraperStore((state) => state.addJob)
  const setCurrentJob = useScraperStore((state) => state.setCurrentJob)

  const scrapeAndAnswer = useCallback(async (
    input: string,
    options?: { scraperType?: ScraperType; useProxy?: boolean; blockResources?: boolean; includeScreenshots?: boolean }
  ): Promise<{ job: IScrapeJob | null; response: string } | null> => {
    setError(null)
    setLoading(true)
    try {
      const response = await axiosInstance.post<{ success: boolean; job?: IScrapeJob; response: string }>(SCRAPE_AND_ANSWER(), {
        input,
        ...options,
      })
      let job = response.data.job || null
      if (job?._id) {
        const freshResponse = await axiosInstance.get<{ success: boolean; job: IScrapeJob }>(GET_SCRAPE_JOB(job._id))
        if (freshResponse.data.job) {
          job = freshResponse.data.job
        }
        addJob(job)
        setCurrentJob(job)
      }
      return { job, response: response.data.response }
    } catch (err) {
      setError(normalizeError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [addJob, setCurrentJob])

  return { scrapeAndAnswer, loading, error }
}

export const useChatWithJob = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Errors | null>(null)
  const updateJob = useScraperStore((state) => state.updateJob)

  const chatWithJob = useCallback(async (jobId: string, message: string): Promise<{ response: string } | null> => {
    if (!jobId || jobId === 'undefined') return null
    setError(null)
    setLoading(true)
    try {
      const response = await axiosInstance.post<{ success: boolean; response: string }>(CHAT_WITH_JOB(jobId), { message })
      const freshResponse = await axiosInstance.get<{ success: boolean; job: IScrapeJob }>(GET_SCRAPE_JOB(jobId))
      if (freshResponse.data.job) {
        updateJob(jobId, freshResponse.data.job)
      }
      return { response: response.data.response }
    } catch (err) {
      setError(normalizeError(err))
      return null
    } finally {
      setLoading(false)
    }
  }, [updateJob])

  return { chatWithJob, loading, error }
}

export const useCurrentJob = () => {
  const currentJob = useScraperStore((state) => state.currentJob)
  const setCurrentJob = useScraperStore((state) => state.setCurrentJob)
  const pendingActions = useScraperStore((state) => state.pendingActions)
  const pendingProgress = useScraperStore((state) => state.pendingProgress)
  const clearPendingActions = useScraperStore((state) => state.clearPendingActions)
  const jobActionsFromStore = useScraperStore((state) => currentJob ? state.jobActions.get(currentJob._id) || [] : [])
  const jobProgressFromStore = useScraperStore((state) => currentJob ? state.jobProgress.get(currentJob._id) : undefined)
  const clearActions = useScraperStore((state) => state.clearActions)

  const jobActions = currentJob ? jobActionsFromStore : pendingActions
  const jobProgress = currentJob ? jobProgressFromStore : pendingProgress

  const selectJob = useCallback(async (job: IScrapeJob | null) => {
    setCurrentJob(job)
    if (job?._id) {
      const response = await axiosInstance.get<{ success: boolean; job: IScrapeJob }>(GET_SCRAPE_JOB(job._id))
      if (response.data.job) {
        useScraperStore.getState().updateJob(job._id, response.data.job)
        setCurrentJob(response.data.job)
      }
    }
  }, [setCurrentJob])

  const clearCurrentJobActions = useCallback(() => {
    clearPendingActions()
    if (currentJob?._id) clearActions(currentJob._id)
  }, [currentJob, clearActions, clearPendingActions])

  return { currentJob, jobProgress, jobActions, setCurrentJob: selectJob, clearActions: clearCurrentJobActions }
}
