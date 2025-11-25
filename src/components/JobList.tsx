/**
 * Job List Component
 * Displays list of scrape jobs with status
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { IScrapeJob, ScrapeStatus } from '../types/scraper';
import { STATUS_CONFIG } from '../constants/status';
import { Card, CardContent } from './ui/Card';
import { clsx } from 'clsx';
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Ban,
  Globe,
} from 'lucide-react';

interface JobListProps {
  jobs: IScrapeJob[];
  onSelectJob: (job: IScrapeJob) => void;
  selectedJobId?: string;
}

const StatusIcon: React.FC<{ status: ScrapeStatus }> = ({ status }) => {
  switch (status) {
    case ScrapeStatus.QUEUED:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    case ScrapeStatus.RUNNING:
      return <Loader2 className="w-4 h-4 text-foreground animate-spin" />;
    case ScrapeStatus.COMPLETED:
      return <CheckCircle className="w-4 h-4 text-foreground" />;
    case ScrapeStatus.FAILED:
      return <XCircle className="w-4 h-4 text-muted-foreground" />;
    case ScrapeStatus.CANCELLED:
      return <Ban className="w-4 h-4 text-muted-foreground" />;
    default:
      return null;
  }
};

const StatusBadge: React.FC<{ status: ScrapeStatus }> = ({ status }) => {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={clsx(
        'px-2.5 py-1 text-xs font-medium rounded-md',
        config.color
      )}
    >
      {config.label}
    </span>
  );
};

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onSelectJob,
  selectedJobId,
}) => {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <Globe className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm text-center text-foreground font-medium">No jobs yet</p>
        <p className="text-xs text-center mt-1.5 text-muted-foreground">Start scraping below!</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-4 space-y-3">
      {jobs.map((job) => (
        <Card
          key={job._id}
          className={clsx(
            'cursor-pointer transition-all duration-200 border rounded-lg',
            selectedJobId === job._id 
              ? 'bg-foreground text-background border-foreground shadow-md' 
              : 'bg-card hover:bg-secondary border-border'
          )}
          onClick={() => onSelectJob(job)}
        >
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">
                <StatusIcon status={job.status} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h4 className={clsx(
                    "text-sm font-semibold truncate leading-tight",
                    selectedJobId === job._id ? 'text-background' : 'text-foreground'
                  )}>
                    {job.taskDescription || 'Web Scrape'}
                  </h4>
                  <StatusBadge status={job.status} />
                </div>
                
                <p className={clsx(
                  "text-xs truncate mb-1.5 leading-relaxed",
                  selectedJobId === job._id ? 'text-background/70' : 'text-muted-foreground'
                )}>
                  {job.url}
                </p>

                {job.metadata.pageTitle && (
                  <p className={clsx(
                    "text-xs truncate mb-2 leading-relaxed",
                    selectedJobId === job._id ? 'text-background/70' : 'text-muted-foreground'
                  )}>
                    {job.metadata.pageTitle}
                  </p>
                )}

                <div className={clsx(
                  "flex items-center justify-between text-xs mt-3 pt-2 border-t",
                  selectedJobId === job._id 
                    ? 'text-background/60 border-background/20' 
                    : 'text-muted-foreground border-border'
                )}>
                  <span>
                    {formatDistanceToNow(new Date(job.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  
                  {job.metadata.duration > 0 && (
                    <span>{(job.metadata.duration / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
