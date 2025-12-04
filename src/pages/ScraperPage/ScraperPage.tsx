/**
 * Scraper Page Component
 * Pure chat-first interface for AI scraping
 */

import React, { useState, useEffect, useRef } from 'react';
import { useScraperStore } from '../../stores/scraper.store';
import { useSocket } from '../../hooks/useSocket';
import { scraperAPI } from '../../utils/api';
import { getOrCreateSessionId } from '../../utils/session';
import { ScraperType, IScrapeJob } from '../../types/scraper';
import {
  Header,
  ChatSidebar,
  ChatMessages,
  ProgressBar,
  ChatInput,
  type Message,
} from './components';

export const ScraperPage: React.FC = () => {
  const {
    jobs,
    currentJob,
    jobProgress,
    setJobs,
    addJob,
    setCurrentJob,
    updateJobProgress,
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
      <Header jobCount={jobs.length} />

      <div className="flex-1 flex overflow-hidden">
        <ChatSidebar
          jobs={jobs}
          selectedJobId={currentJob?._id}
          onSelectJob={handleSelectJob}
          onNewChat={handleNewChat}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <ChatMessages
            messages={messages}
            isProcessing={isProcessing}
            messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
          />

          {currentProgress && (
            <ProgressBar
              message={currentProgress.message}
              progress={currentProgress.progress}
            />
          )}

          <ChatInput
            input={input}
            setInput={setInput}
            scraperType={scraperType}
            setScraperType={setScraperType}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            blockResources={blockResources}
            setBlockResources={setBlockResources}
            includeScreenshots={includeScreenshots}
            setIncludeScreenshots={setIncludeScreenshots}
            useProxy={useProxy}
            setUseProxy={setUseProxy}
            isProcessing={isProcessing}
            onSubmit={handleSubmit}
          />
        </main>
      </div>
    </div>
  );
};
