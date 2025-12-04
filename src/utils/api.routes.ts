const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  return url.replace(/\/$/, '')
}

export const BASE_URL = getBaseUrl()
export const SOCKET_SERVER = BASE_URL

export const SocketScrapeEvents = {
  PROGRESS: 'scrape:progress',
  COMPLETE: 'scrape:complete',
  ERROR: 'scrape:error',
  ACTION: 'scrape:action',
  JOIN: 'scrape:join',
  LEAVE: 'scrape:leave',
  SUBSCRIBE_SESSION: 'scrape:subscribe:session',
  UNSUBSCRIBE_SESSION: 'scrape:unsubscribe:session',
} as const

export type SocketScrapeEventsEnum = typeof SocketScrapeEvents[keyof typeof SocketScrapeEvents]

export const GET_SCRAPE_JOBS = () => `/api/scrape`
export const GET_SCRAPE_JOB = (jobId: string) => `/api/scrape/${jobId}`
export const CREATE_SCRAPE_JOB = () => `/api/scrape`
export const DELETE_SCRAPE_JOB = (jobId: string) => `/api/scrape/${jobId}`
export const CANCEL_SCRAPE_JOB = (jobId: string) => `/api/scrape/${jobId}/cancel`
export const SCRAPE_STATS = () => `/api/scrape/stats`
export const CHAT_WITH_JOB = (jobId: string) => `/api/scrape/${jobId}/chat`
export const SCRAPE_AND_ANSWER = () => `/api/scrape/ask`
