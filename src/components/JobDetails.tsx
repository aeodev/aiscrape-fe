import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { IScrapeJob, ScrapeStatus } from '../types/scraper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import {
  FileText,
  Code,
  Image as ImageIcon,
  Clock,
  Globe,
  Download,
  MessageSquare,
} from 'lucide-react';
import { ChatInterface } from './ChatInterface';

interface JobDetailsProps {
  job: IScrapeJob;
  progress?: {
    progress: number;
    message: string;
  };
  onCancel?: () => void;
  onDelete?: () => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({
  job,
  progress,
  onCancel,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'html' | 'text' | 'chat'>('markdown');

  const tabs = [
    { id: 'markdown', label: 'Markdown', icon: FileText, available: !!job.markdown },
    { id: 'html', label: 'HTML', icon: Code, available: !!job.html },
    { id: 'text', label: 'Text', icon: FileText, available: !!job.text },
    { id: 'chat', label: 'Chat', icon: MessageSquare, available: !!job.text || !!job.markdown },
  ];

  const canCancel = job.status === ScrapeStatus.QUEUED || job.status === ScrapeStatus.RUNNING;
  const isComplete = job.status === ScrapeStatus.COMPLETED;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-6 lg:px-8 bg-card">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-semibold mb-3 text-foreground tracking-tight">
                {job.taskDescription || 'Scrape Job'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline truncate max-w-md text-foreground hover:text-foreground/80 transition-colors"
                >
                  {job.url}
                </a>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              {canCancel && onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {progress && job.status === ScrapeStatus.RUNNING && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{progress.message}</span>
                <span className="text-sm font-medium text-foreground">{progress.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-foreground h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          {job.metadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Status</p>
                <p className="text-sm font-semibold capitalize text-foreground">{job.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Duration</p>
                <p className="text-sm font-semibold text-foreground">
                  {job.metadata.duration > 0
                    ? `${(job.metadata.duration / 1000).toFixed(1)}s`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Data Size</p>
                <p className="text-sm font-semibold text-foreground">
                  {job.metadata.dataSize > 0
                    ? `${(job.metadata.dataSize / 1024).toFixed(1)} KB`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">Created</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      {isComplete && (
        <div className="border-b border-border bg-card">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-8">
            <div className="flex gap-2 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  disabled={!tab.available}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-foreground text-background'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
                    !tab.available && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Display */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-8 py-8">
          {!isComplete && job.status === ScrapeStatus.RUNNING && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Clock className="w-16 h-16 mb-4 animate-pulse text-foreground" />
              <p className="text-lg font-medium text-foreground mb-2">Scraping in progress...</p>
              <p className="text-sm text-muted-foreground">{progress?.message}</p>
            </div>
          )}

          {!isComplete && job.status === ScrapeStatus.QUEUED && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Clock className="w-16 h-16 mb-4 text-muted-foreground" />
              <p className="text-lg font-medium text-foreground mb-2">Job queued</p>
              <p className="text-sm text-muted-foreground">Waiting to start...</p>
            </div>
          )}

          {job.status === ScrapeStatus.FAILED && (
            <Card className="bg-secondary border-border">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Error</CardTitle>
                <CardDescription className="text-muted-foreground">{job.metadata.errorMessage}</CardDescription>
              </CardHeader>
            </Card>
          )}

          {isComplete && (
            <div className="max-w-5xl">
              {activeTab === 'markdown' && job.markdown && (
                <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border">
                  <ReactMarkdown>{job.markdown}</ReactMarkdown>
                </div>
              )}

              {activeTab === 'html' && job.html && (
                <pre className="bg-secondary p-6 rounded-lg overflow-x-auto text-xs text-foreground border border-border font-mono">
                  <code>{job.html}</code>
                </pre>
              )}

              {activeTab === 'text' && job.text && (
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-mono bg-secondary p-6 rounded-lg border border-border">
                  {job.text}
                </div>
              )}

              {activeTab === 'chat' && (
                <ChatInterface
                  jobId={job._id}
                  initialHistory={job.chatHistory}
                />
              )}

              {/* Screenshots */}
              {job.screenshots && job.screenshots.length > 0 && activeTab !== 'chat' && (
                <Card className="mt-8 border-border">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      <ImageIcon className="w-5 h-5" />
                      Screenshots
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {job.screenshots.map((screenshot, index) => (
                        <img
                          key={index}
                          src={screenshot}
                          alt={`Screenshot ${index + 1}`}
                          className="rounded-lg border border-border w-full"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
