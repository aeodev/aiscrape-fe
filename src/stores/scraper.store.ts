/**
 * Scraper Zustand Store
 * Global state management for scraping operations
 */

import { create } from 'zustand';
import {
  IScrapeJob,
  IScrapeProgressEvent,
  ScrapeStatus,
} from '../types/scraper';

interface JobProgress {
  jobId: string;
  progress: number;
  message: string;
  status: ScrapeStatus;
}

interface ScraperState {
  // Jobs
  jobs: IScrapeJob[];
  currentJob: IScrapeJob | null;
  
  // Progress tracking
  jobProgress: Map<string, JobProgress>;
  
  // UI state
  isCreatingJob: boolean;
  error: string | null;

  // Actions
  setJobs: (jobs: IScrapeJob[]) => void;
  addJob: (job: IScrapeJob) => void;
  updateJob: (jobId: string, updates: Partial<IScrapeJob>) => void;
  removeJob: (jobId: string) => void;
  setCurrentJob: (job: IScrapeJob | null) => void;
  
  updateJobProgress: (event: IScrapeProgressEvent) => void;
  clearJobProgress: (jobId: string) => void;
  
  setIsCreatingJob: (isCreating: boolean) => void;
  setError: (error: string | null) => void;
  
  reset: () => void;
}

export const useScraperStore = create<ScraperState>((set, get) => ({
  // Initial state
  jobs: [],
  currentJob: null,
  jobProgress: new Map(),
  isCreatingJob: false,
  error: null,

  // Actions
  setJobs: (jobs) => set({ jobs }),

  addJob: (job) => set((state) => ({
    jobs: [job, ...state.jobs],
  })),

  updateJob: (jobId, updates) => set((state) => {
    const jobs = state.jobs.map((job) =>
      job._id === jobId ? { ...job, ...updates } : job
    );

    const currentJob =
      state.currentJob?._id === jobId
        ? { ...state.currentJob, ...updates }
        : state.currentJob;

    return { jobs, currentJob };
  }),

  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter((job) => job._id !== jobId),
    currentJob: state.currentJob?._id === jobId ? null : state.currentJob,
  })),

  setCurrentJob: (job) => set({ currentJob: job }),

  updateJobProgress: (event) => {
    set((state) => {
      const newProgress = new Map(state.jobProgress);
      newProgress.set(event.jobId, {
        jobId: event.jobId,
        progress: event.progress,
        message: event.message,
        status: event.status,
      });
      return { jobProgress: newProgress };
    });

    // Also update the job status in the jobs array
    get().updateJob(event.jobId, {
      status: event.status,
      metadata: {
        ...get().jobs.find((j) => j._id === event.jobId)?.metadata,
        ...event.metadata,
      } as any,
    });
  },

  clearJobProgress: (jobId) => set((state) => {
    const newProgress = new Map(state.jobProgress);
    newProgress.delete(jobId);
    return { jobProgress: newProgress };
  }),

  setIsCreatingJob: (isCreating) => set({ isCreatingJob: isCreating }),

  setError: (error) => set({ error }),

  reset: () => set({
    jobs: [],
    currentJob: null,
    jobProgress: new Map(),
    isCreatingJob: false,
    error: null,
  }),
}));


