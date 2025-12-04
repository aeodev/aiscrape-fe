/**
 * Frontend Types for Scraper
 * Mirrors backend types
 */

export enum ScrapeStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ScraperType {
  PLAYWRIGHT = 'playwright',
  PUPPETEER = 'puppeteer',
  CHEERIO = 'cheerio',
  AUTO = 'auto',
}

export interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export enum EntityType {
  COMPANY = 'company',
  PERSON = 'person',
  PRODUCT = 'product',
  ARTICLE = 'article',
  CONTACT = 'contact',
  PRICING = 'pricing',
  CUSTOM = 'custom',
}

export interface IScrapeJob {
  _id: string;
  url: string;
  taskDescription: string;
  status: ScrapeStatus;
  scraperType: ScraperType;
  userId?: string;
  sessionId?: string;
  html?: string;
  markdown?: string;
  text?: string;
  screenshots?: string[];
  extractedEntities: IExtractedEntity[];
  metadata: IScrapeMetadata;
  aiProcessing?: IAIProcessing;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  scrapeOptions?: {
    useProxy?: boolean;
    blockResources?: boolean;
    includeScreenshots?: boolean;
  };
  chatHistory?: IChatMessage[];
}

export interface IExtractedEntity {
  type: EntityType;
  data: any;
  confidence?: number;
  source?: string;
}

export interface IScrapeMetadata {
  finalUrl?: string;
  statusCode?: number;
  contentType?: string;
  pageTitle?: string;
  pageDescription?: string;
  duration: number;
  requestCount: number;
  dataSize: number;
  screenshotCount: number;
  errorMessage?: string;
  retryCount: number;
  scraperUsed?: ScraperType;
}

export interface IAIProcessing {
  model: string;
  prompt: string;
  response?: string;
  tokensUsed?: number;
  processingTime?: number;
  success: boolean;
  error?: string;
}

export interface ICreateScrapeJobRequest {
  url: string;
  taskDescription?: string;
  scraperType?: ScraperType;
  extractEntities?: EntityType[];
  useAI?: boolean;
  aiModel?: string;
  includeScreenshots?: boolean;
  includeMarkdown?: boolean;
  useProxy?: boolean;
  blockResources?: boolean;
}

export interface IScrapeJobResponse {
  success: boolean;
  job?: IScrapeJob;
  error?: string;
}

export interface IScrapeListResponse {
  success: boolean;
  jobs?: IScrapeJob[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}

export interface IScrapeProgressEvent {
  jobId: string;
  status: ScrapeStatus;
  message: string;
  progress: number;
  metadata?: Partial<IScrapeMetadata>;
}

export interface IScrapeCompleteEvent {
  jobId: string;
  status: ScrapeStatus;
  job: IScrapeJob;
}

export interface IScrapeErrorEvent {
  jobId: string;
  error: string;
  status: ScrapeStatus;
}

export type ScrapeActionType = 
  | 'OBSERVATION' 
  | 'ACTION' 
  | 'EXTRACTION' 
  | 'ANALYSIS' 
  | 'NAVIGATION' 
  | 'CLICK' 
  | 'WAIT';

export interface IScrapeActionEvent {
  jobId: string;
  type: ScrapeActionType;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}


