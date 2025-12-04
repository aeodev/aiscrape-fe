import React from 'react';
import { Bot, Sparkles, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  jobId?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isProcessing: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isProcessing,
  messagesEndRef,
}) => {
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
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
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
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
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
