/**
 * Status configuration constants
 */

import { ScrapeStatus } from '../types/scraper';

export const STATUS_CONFIG = {
  [ScrapeStatus.QUEUED]: {
    label: 'Queued',
    color: 'bg-secondary text-muted-foreground',
  },
  [ScrapeStatus.RUNNING]: {
    label: 'Running',
    color: 'bg-foreground text-background',
  },
  [ScrapeStatus.COMPLETED]: {
    label: 'Done',
    color: 'bg-foreground text-background',
  },
  [ScrapeStatus.FAILED]: {
    label: 'Failed',
    color: 'bg-secondary text-muted-foreground',
  },
  [ScrapeStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'bg-secondary text-muted-foreground',
  },
} as const;

export type StatusKey = keyof typeof STATUS_CONFIG;

