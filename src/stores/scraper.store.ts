import { create } from 'zustand'
import axiosInstance from '@/utils/axios.instance'
import {
  GET_SCRAPE_JOBS,
  GET_SCRAPE_JOB,
  DELETE_SCRAPE_JOB,
  CANCEL_SCRAPE_JOB,
  CHAT_WITH_JOB,
  SCRAPE_AND_ANSWER,
} from '@/utils/api.routes'
import { getOrCreateSessionId } from '@/utils/session'
import type {
  IScrapeJob,
  IScrapeProgressEvent,
  IScrapeActionEvent,
  ScrapeStatus,
  ScraperType,
} from '@/types/scraper'

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

type JobProgress = {
  jobId: string
  progress: number
  message: string
  status: ScrapeStatus
}

type ScraperState = {
  jobs: IScrapeJob[]
  currentJob: IScrapeJob | null
  jobProgress: Map<string, JobProgress>
  jobActions: Map<string, IScrapeActionEvent[]>
  pendingActions: IScrapeActionEvent[]
  pendingProgress: JobProgress | null
  loading: { jobs: boolean; job: boolean; creating: boolean }
  errors: { jobs: Errors | null; job: Errors | null; creating: Errors | null }
}

type ScraperActions = {
  setJobs: (jobs: IScrapeJob[]) => void
  addJob: (job: IScrapeJob) => void
  updateJob: (jobId: string, updates: Partial<IScrapeJob>) => void
  removeJob: (jobId: string) => void
  setCurrentJob: (job: IScrapeJob | null) => void
  updateJobProgress: (event: IScrapeProgressEvent) => void
  clearJobProgress: (jobId: string) => void
  addAction: (jobId: string, action: IScrapeActionEvent) => void
  addPendingAction: (action: IScrapeActionEvent) => void
  clearActions: (jobId: string) => void
  clearPendingActions: () => void
  setPendingProgress: (progress: JobProgress | null) => void
  setError: (error: string | null) => void
  fetchJobs: () => Promise<IScrapeJob[]>
  fetchJob: (jobId: string) => Promise<IScrapeJob | null>
  deleteJob: (jobId: string) => Promise<boolean>
  cancelJob: (jobId: string) => Promise<IScrapeJob | null>
  chatWithJob: (jobId: string, message: string) => Promise<{ response: string } | null>
  scrapeAndAnswer: (
    input: string,
    options?: { scraperType?: ScraperType; useProxy?: boolean; blockResources?: boolean; includeScreenshots?: boolean }
  ) => Promise<{ job: IScrapeJob | null; response: string } | null>
  reset: () => void
}

type ScraperStore = ScraperState & ScraperActions

export const useScraperStore = create<ScraperStore>((set, get) => ({
  jobs: [],
  currentJob: null,
  jobProgress: new Map(),
  jobActions: new Map(),
  pendingActions: [],
  pendingProgress: null,
  loading: { jobs: false, job: false, creating: false },
  errors: { jobs: null, job: null, creating: null },

  setJobs: (jobs) => set({ jobs }),

  addJob: (job) => set((state) => ({ jobs: [job, ...state.jobs] })),

  updateJob: (jobId, updates) => set((state) => {
    const jobs = state.jobs.map((job) => (job._id === jobId ? { ...job, ...updates } : job))
    const currentJob = state.currentJob?._id === jobId ? { ...state.currentJob, ...updates } : state.currentJob
    return { jobs, currentJob }
  }),

  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter((job) => job._id !== jobId),
    currentJob: state.currentJob?._id === jobId ? null : state.currentJob,
  })),

  setCurrentJob: (job) => set({ currentJob: job }),

  updateJobProgress: (event) => {
    set((state) => {
      const newProgress = new Map(state.jobProgress)
      newProgress.set(event.jobId, {
        jobId: event.jobId,
        progress: event.progress,
        message: event.message,
        status: event.status,
      })
      return { jobProgress: newProgress }
    })
    get().updateJob(event.jobId, {
      status: event.status,
      metadata: { ...get().jobs.find((j) => j._id === event.jobId)?.metadata, ...event.metadata } as IScrapeJob['metadata'],
    })
  },

  clearJobProgress: (jobId) => set((state) => {
    const newProgress = new Map(state.jobProgress)
    newProgress.delete(jobId)
    return { jobProgress: newProgress }
  }),

  addAction: (jobId, action) => set((state) => {
    const newActions = new Map(state.jobActions)
    const existingActions = newActions.get(jobId) || []
    newActions.set(jobId, [...existingActions, action])
    return { jobActions: newActions }
  }),

  addPendingAction: (action) => set((state) => ({
    pendingActions: [...state.pendingActions, action],
  })),

  clearActions: (jobId) => set((state) => {
    const newActions = new Map(state.jobActions)
    newActions.delete(jobId)
    return { jobActions: newActions }
  }),

  clearPendingActions: () => set({ pendingActions: [], pendingProgress: null }),

  setPendingProgress: (progress) => set({ pendingProgress: progress }),

  setError: (error) => set({ errors: { ...get().errors, job: error ? { message: error } : null } }),

  fetchJobs: async () => {
    set({ loading: { ...get().loading, jobs: true }, errors: { ...get().errors, jobs: null } })
    try {
      const sessionId = getOrCreateSessionId()
      const response = await axiosInstance.get<{ success: boolean; jobs: IScrapeJob[] }>(GET_SCRAPE_JOBS(), {
        params: { sessionId },
      })
      const jobs = response.data.jobs || []
      set({ jobs, loading: { ...get().loading, jobs: false } })
      return jobs
    } catch (err) {
      set({ errors: { ...get().errors, jobs: normalizeError(err) }, loading: { ...get().loading, jobs: false } })
      return []
    }
  },

  fetchJob: async (jobId) => {
    if (!jobId || jobId === 'undefined') return null
    set({ loading: { ...get().loading, job: true }, errors: { ...get().errors, job: null } })
    try {
      const response = await axiosInstance.get<{ success: boolean; job: IScrapeJob }>(GET_SCRAPE_JOB(jobId))
      const job = response.data.job
      if (job) {
        const exists = get().jobs.find((j) => j._id === job._id)
        if (exists) get().updateJob(job._id, job)
        else get().addJob(job)
      }
      set({ loading: { ...get().loading, job: false } })
      return job || null
    } catch (err) {
      set({ errors: { ...get().errors, job: normalizeError(err) }, loading: { ...get().loading, job: false } })
      return null
    }
  },

  deleteJob: async (jobId) => {
    if (!jobId || jobId === 'undefined') return false
    try {
      await axiosInstance.delete(DELETE_SCRAPE_JOB(jobId))
      get().removeJob(jobId)
      return true
    } catch {
      return false
    }
  },

  cancelJob: async (jobId) => {
    if (!jobId || jobId === 'undefined') return null
    try {
      const response = await axiosInstance.post<{ success: boolean; job: IScrapeJob }>(CANCEL_SCRAPE_JOB(jobId))
      const job = response.data.job
      if (job) get().updateJob(jobId, job)
      return job || null
    } catch {
      return null
    }
  },

  chatWithJob: async (jobId, message) => {
    if (!jobId || jobId === 'undefined') return null
    set({ loading: { ...get().loading, job: true }, errors: { ...get().errors, job: null } })
    try {
      const response = await axiosInstance.post<{ success: boolean; response: string }>(CHAT_WITH_JOB(jobId), { message })
      await get().fetchJob(jobId)
      set({ loading: { ...get().loading, job: false } })
      return { response: response.data.response }
    } catch (err) {
      set({ errors: { ...get().errors, job: normalizeError(err) }, loading: { ...get().loading, job: false } })
      return null
    }
  },

  scrapeAndAnswer: async (input, options) => {
    set({ loading: { ...get().loading, creating: true }, errors: { ...get().errors, creating: null } })
    try {
      const response = await axiosInstance.post<{ success: boolean; job?: IScrapeJob; response: string }>(SCRAPE_AND_ANSWER(), {
        input,
        ...options,
      })
      let job = response.data.job || null
      if (job?._id) {
        const freshJob = await get().fetchJob(job._id)
        if (freshJob) {
          job = freshJob
          get().setCurrentJob(freshJob)
        } else {
          get().addJob(job)
          get().setCurrentJob(job)
        }
      }
      set({ loading: { ...get().loading, creating: false } })
      return { job, response: response.data.response }
    } catch (err) {
      set({ errors: { ...get().errors, creating: normalizeError(err) }, loading: { ...get().loading, creating: false } })
      return null
    }
  },

  reset: () => set({
    jobs: [],
    currentJob: null,
    jobProgress: new Map(),
    jobActions: new Map(),
    pendingActions: [],
    pendingProgress: null,
    loading: { jobs: false, job: false, creating: false },
    errors: { jobs: null, job: null, creating: null },
  }),
}))
