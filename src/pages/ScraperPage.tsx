/**
 * Scraper Page Component
 * Pure chat-first interface for AI scraping
 */

import React, { useState, useEffect, useRef } from 'react';
import { useScraperStore } from '../stores/scraper.store';
import { useSocket } from '../hooks/useSocket';
import { scraperAPI } from '../utils/api';
import { getOrCreateSessionId } from '../utils/session';
import { JobList } from '../components/JobList';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { ScraperType, IScrapeJob } from '../types/scraper';
import {
  Send,
  Loader2,
  Sparkles,
  Settings,
  Bot,
  User,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  jobId?: string;
}

export const ScraperPage: React.FC = () => {
  const {
    jobs,
    currentJob,
    jobProgress,
    isCreatingJob,
    setJobs,
    addJob,
    setCurrentJob,
    updateJobProgress,
    setIsCreatingJob,
    setError,
  } = useScraperStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scraperType, setScraperType] = useState<ScraperType>(ScraperType.AUTO);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [blockResources, setBlockResources] = useState(true);
  const [includeScreenshots, setIncludeScreenshots] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session ID
  useEffect(() => {
    getOrCreateSessionId();
  }, []);

  // Socket.IO integration
  const socketHandlers = React.useMemo(() => ({
    onProgress: (event: any) => {
      updateJobProgress(event);
    },
    onComplete: (event: any) => {
      // Refresh job data
      scraperAPI.getJob(event.jobId).then((response) => {
        if (response.success && response.job) {
          useScraperStore.getState().updateJob(event.jobId, response.job);
        }
      });
    },
    onError: (event: any) => {
      setError(event.error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Error: ${event.error}`,
        timestamp: new Date().toISOString(),
      }]);
    },
  }), [updateJobProgress, setError]);

  const { subscribeToSession } = useSocket(socketHandlers);

  // Subscribe to session on mount
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    subscribeToSession(sessionId);
  }, [subscribeToSession]);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const response = await scraperAPI.getJobs({ sessionId });

      if (response.success && response.jobs) {
        setJobs(response.jobs);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setIsCreatingJob(true);

    try {
      // If there's a current job, use chat endpoint
      if (currentJob) {
        const result = await scraperAPI.chatWithJob(currentJob._id, userMessage.content);

        if (result.success) {
          const aiMessage: Message = {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
            jobId: currentJob._id,
          };
          setMessages(prev => [...prev, aiMessage]);

          // Update job in store with new chat history
          try {
            const freshJobResponse = await scraperAPI.getJob(currentJob._id);
            if (freshJobResponse.success && freshJobResponse.job) {
              useScraperStore.getState().updateJob(currentJob._id, freshJobResponse.job);
            }
          } catch {
            // Silently fail - messages are already shown in UI
          }
        }
      } else {
        // New scraping request
        const response = await scraperAPI.scrapeAndAnswer(userMessage.content, {
          scraperType,
          useProxy,
          blockResources,
          includeScreenshots,
        });

        if (response.success) {
          // Add AI response to chat immediately
          const aiMessage: Message = {
            role: 'assistant',
            content: response.response,
            timestamp: new Date().toISOString(),
            jobId: response.job?._id,
          };
          setMessages(prev => [...prev, aiMessage]);

          // If a job was created, fetch fresh data and add to list
          if (response.job) {
            try {
              // Fetch the updated job with chatHistory
              const freshJobResponse = await scraperAPI.getJob(response.job._id);
              if (freshJobResponse.success && freshJobResponse.job) {
                addJob(freshJobResponse.job);
                setCurrentJob(freshJobResponse.job);
              } else {
                addJob(response.job);
                setCurrentJob(response.job);
              }
            } catch {
              addJob(response.job);
              setCurrentJob(response.job);
            }
          }
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'system',
        content: `Sorry, I encountered an error: ${error.response?.data?.error || error.message || 'Failed to process request'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setIsCreatingJob(false);
    }
  };

  const handleNewChat = () => {
    setCurrentJob(null);
    setMessages([]);
  };

  // Helper to load messages from job data
  const loadMessagesFromJob = (job: IScrapeJob) => {
    const chatMessages: Message[] = [];

    // Add chat history (which includes the initial question and AI response)
    if (job.chatHistory && job.chatHistory.length > 0) {
      job.chatHistory.forEach((msg: any) => {
        chatMessages.push({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || job.createdAt,
          jobId: job._id,
        });
      });
    } else if (job.taskDescription) {
      // Fallback: if no chat history yet, show the task description as user message
      chatMessages.push({
        role: 'user',
        content: job.taskDescription,
        timestamp: job.createdAt,
        jobId: job._id,
      });
    }

    setMessages(chatMessages);
  };

  const handleSelectJob = async (job: IScrapeJob) => {
    setCurrentJob(job);
    
    // Fetch fresh job data to get latest chatHistory
    try {
      const response = await scraperAPI.getJob(job._id);
      if (response.success && response.job) {
        // Update the job in the store with fresh data
        useScraperStore.getState().updateJob(job._id, response.job);
        loadMessagesFromJob(response.job);
      } else {
        // Fallback to local data
        loadMessagesFromJob(job);
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      // Fallback to local data
      loadMessagesFromJob(job);
    }
  };

  const currentProgress = currentJob ? jobProgress.get(currentJob._id) : undefined;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-background" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground leading-none">
                    AIScrape
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Web Scraping Platform</p>
                </div>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-foreground animate-pulse" />
                  <span className="text-muted-foreground font-medium">Live</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                </span>
              </div>
              {(isCreatingJob || isProcessing) && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing</span>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-border bg-card/50 flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Chats
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleNewChat}
                  className="h-6 px-2 flex items-center gap-1 bg-foreground text-background hover:opacity-90 rounded text-[10px] font-medium transition-opacity"
                  title="New chat"
                >
                  <Sparkles className="w-3 h-3" />
                  New
                </button>
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {jobs.length}
                </span>
                {isCreatingJob && (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <JobList
              jobs={jobs}
              onSelectJob={handleSelectJob}
              selectedJobId={currentJob?._id}
            />
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-6">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-foreground">
                      Start a Conversation
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ask me to scrape any website and I'll extract the data for you
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                      <span className="px-2 py-1 rounded bg-secondary">Static</span>
                      <span className="px-2 py-1 rounded bg-secondary">Dynamic</span>
                      <span className="px-2 py-1 rounded bg-secondary">SPAs</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                            ? 'bg-foreground text-background'
                            : msg.role === 'system'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-secondary text-muted-foreground'
                          }`}
                      >
                        {msg.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>

                      <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-3 rounded-lg ${msg.role === 'user'
                              ? 'bg-foreground text-background'
                              : msg.role === 'system'
                                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                                : 'bg-card border border-border text-foreground'
                            }`}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:border prose-pre:border-border">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <span className="text-sm whitespace-pre-wrap">{msg.content}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="bg-card border border-border px-4 py-3 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {currentProgress && (
            <div className="border-t border-border bg-card/50 px-6 py-2">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{currentProgress.message}</span>
                  <span className="text-xs font-medium text-foreground">{currentProgress.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-foreground h-1 rounded-full transition-all duration-300"
                    style={{ width: `${currentProgress.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="border-t border-border bg-card/50">
            <div className="max-w-4xl mx-auto px-6 py-3">
              <form onSubmit={handleSubmit}>
                {/* Compact Input Row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me to scrape a website... e.g., 'Get team names from https://example.com'"
                      className="w-full h-10 pl-3 pr-3 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder:text-muted-foreground text-sm"
                      disabled={isProcessing}
                    />
                  </div>

                  <select
                    value={scraperType}
                    onChange={(e) => setScraperType(e.target.value as ScraperType)}
                    className="h-10 px-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-background text-foreground text-xs w-24"
                    disabled={isProcessing}
                  >
                    <option value={ScraperType.AUTO}>Auto</option>
                    <option value={ScraperType.PLAYWRIGHT}>Playwright</option>
                    <option value={ScraperType.CHEERIO}>Cheerio</option>
                    <option value={ScraperType.PUPPETEER}>Puppeteer</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`h-10 w-10 flex items-center justify-center border border-border rounded-md hover:bg-secondary transition-colors ${showAdvanced ? 'bg-secondary' : 'bg-background'}`}
                    title="Advanced options"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <Button
                    type="submit"
                    disabled={isProcessing || !input.trim()}
                    size="sm"
                    className="h-10 px-4"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={blockResources}
                        onChange={(e) => setBlockResources(e.target.checked)}
                        className="w-3 h-3 rounded border-border"
                      />
                      <span>Block resources</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={includeScreenshots}
                        onChange={(e) => setIncludeScreenshots(e.target.checked)}
                        className="w-3 h-3 rounded border-border"
                      />
                      <span>Screenshots</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={useProxy}
                        onChange={(e) => setUseProxy(e.target.checked)}
                        className="w-3 h-3 rounded border-border"
                      />
                      <span>Proxy</span>
                    </label>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};