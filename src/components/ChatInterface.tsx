import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react'
import { useChatWithJob } from '@/hooks/scraper.hooks'
import { Button } from '@/components/ui/Button'
import ReactMarkdown from 'react-markdown'
import { formatDistanceToNow } from 'date-fns'
import type { IChatMessage } from '@/types/scraper'

interface ChatInterfaceProps {
  jobId: string
  initialHistory?: IChatMessage[]
  onUpdateHistory?: (history: IChatMessage[]) => void
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  jobId,
  initialHistory = [],
  onUpdateHistory,
}) => {
  const [messages, setMessages] = useState<IChatMessage[]>(initialHistory)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { chatWithJob, loading } = useChatWithJob()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: IChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    try {
      const result = await chatWithJob(jobId, userMessage.content)
      if (result) {
        const aiMessage: IChatMessage = {
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString(),
        }
        const newHistory = [...messages, userMessage, aiMessage]
        setMessages(newHistory)
        onUpdateHistory?.(newHistory)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: 'Failed to send message. Please try again.', timestamp: new Date().toISOString() } as IChatMessage,
      ])
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-background border border-border rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-center">
              Ask questions about the scraped content.
              <br />
              Example: "Summarize the main points" or "Extract all prices"
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-3 rounded-lg text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-secondary px-4 py-3 rounded-lg flex items-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the data..."
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <Button type="submit" disabled={!input.trim() || loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  )
}
