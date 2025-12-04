import React, { useState, useEffect, useRef } from 'react'
import { useScraperJobs, useCurrentJob, useScrapeAndAnswer, useChatWithJob } from '@/hooks/scraper.hooks'
import { useSocket } from '@/composables/useSocket'
import { useScraperStore } from '@/stores/scraper.store'
import type { ScraperType, IScrapeJob } from '@/types/scraper'
import { ScraperType as ScraperTypeEnum } from '@/types/scraper'
import { Header, ChatSidebar, ChatMessages, ProgressBar, ChatInput, type Message } from './components'

export const ScraperPage: React.FC = () => {
  useSocket()

  const { data: jobs } = useScraperJobs()
  const { currentJob, jobProgress, jobActions, setCurrentJob, clearActions } = useCurrentJob()
  const { scrapeAndAnswer, loading: isScraping } = useScrapeAndAnswer()
  const { chatWithJob, loading: isChatting } = useChatWithJob()
  const storeError = useScraperStore((state) => state.errors.job)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [scraperType, setScraperType] = useState<ScraperType>(ScraperTypeEnum.AUTO)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [useProxy, setUseProxy] = useState(false)
  const [blockResources, setBlockResources] = useState(true)
  const [includeScreenshots, setIncludeScreenshots] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isProcessing = isScraping || isChatting

  useEffect(() => {
    if (storeError) {
      const errorMessage: Message = {
        role: 'system',
        content: `Error: ${typeof storeError.message === 'string' ? storeError.message : storeError.message.join(', ')}`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role === 'system' && lastMessage.content === errorMessage.content) return prev
        return [...prev, errorMessage]
      })
    }
  }, [storeError])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = input.trim()
    setInput('')

    if (currentJob) clearActions()

    try {
      if (currentJob) {
        const result = await chatWithJob(currentJob._id, messageContent)
        if (result) {
          const aiMessage: Message = {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
            jobId: currentJob._id,
          }
          setMessages((prev) => [...prev, aiMessage])
        }
      } else {
        const result = await scrapeAndAnswer(messageContent, {
          scraperType,
          useProxy,
          blockResources,
          includeScreenshots,
        })
        if (result) {
          const aiMessage: Message = {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toISOString(),
            jobId: result.job?._id,
          }
          setMessages((prev) => [...prev, aiMessage])
          if (result.job) clearActions()
        }
      }
    } catch (error: unknown) {
      const errorMessage: Message = {
        role: 'system',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleNewChat = () => {
    clearActions()
    setCurrentJob(null)
    setMessages([])
  }

  const loadMessagesFromJob = (job: IScrapeJob) => {
    const chatMessages: Message[] = []
    if (job.chatHistory && job.chatHistory.length > 0) {
      job.chatHistory.forEach((msg) => {
        chatMessages.push({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || job.createdAt,
          jobId: job._id,
        })
      })
    } else if (job.taskDescription) {
      chatMessages.push({
        role: 'user',
        content: job.taskDescription,
        timestamp: job.createdAt,
        jobId: job._id,
      })
    }
    setMessages(chatMessages)
  }

  const handleSelectJob = async (job: IScrapeJob) => {
    if (currentJob && currentJob._id !== job._id) clearActions()
    await setCurrentJob(job)
    const updatedJob = useScraperStore.getState().currentJob || job
    loadMessagesFromJob(updatedJob)
  }

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
            actions={isProcessing ? jobActions : []}
          />
          {jobProgress && (
            <ProgressBar message={jobProgress.message} progress={jobProgress.progress} />
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
  )
}
