import React from 'react'
import { Bot, Sparkles, User, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { formatDistanceToNow } from 'date-fns'
import type { IScrapeActionEvent } from '@/types/scraper'
import { ActionStream } from './ActionStream'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  jobId?: string
}

interface ChatMessagesProps {
  messages: Message[]
  isProcessing: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
  actions?: IScrapeActionEvent[]
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isProcessing,
  messagesEndRef,
  actions = [],
}) => {
  if (messages.length === 0 && !isProcessing) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">Start a Conversation</h3>
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
      </div>
    )
  }

  const hasActions = actions && actions.length > 0

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-foreground text-background'
                  : msg.role === 'system'
                    ? 'bg-destructive text-destructive-foreground'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-3 rounded-lg ${
                  msg.role === 'user'
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
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50 bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                    <span className="text-sm font-medium text-foreground">
                      {hasActions ? 'Working on it' : 'Thinking'}
                    </span>
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
                {hasActions ? (
                  <div className="px-4 py-3">
                    <ActionStream actions={actions} />
                  </div>
                ) : (
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse" />
                      <span>Processing your request...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
