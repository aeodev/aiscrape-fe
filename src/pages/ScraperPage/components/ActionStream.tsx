import React, { useEffect, useRef } from 'react'
import type { IScrapeActionEvent, ScrapeActionType } from '@/types/scraper'

interface ActionStreamProps {
  actions: IScrapeActionEvent[]
}

const getActionColor = (type: ScrapeActionType): string => {
  switch (type) {
    case 'OBSERVATION': return 'text-blue-400'
    case 'ACTION': return 'text-emerald-400'
    case 'EXTRACTION': return 'text-amber-400'
    case 'ANALYSIS': return 'text-violet-400'
    case 'NAVIGATION': return 'text-cyan-400'
    case 'CLICK': return 'text-orange-400'
    case 'WAIT': return 'text-slate-400'
    default: return 'text-slate-500'
  }
}

const getActionBgColor = (type: ScrapeActionType): string => {
  switch (type) {
    case 'OBSERVATION': return 'bg-blue-500/10'
    case 'ACTION': return 'bg-emerald-500/10'
    case 'EXTRACTION': return 'bg-amber-500/10'
    case 'ANALYSIS': return 'bg-violet-500/10'
    case 'NAVIGATION': return 'bg-cyan-500/10'
    case 'CLICK': return 'bg-orange-500/10'
    case 'WAIT': return 'bg-slate-500/10'
    default: return 'bg-slate-500/10'
  }
}

const getActionLabel = (type: ScrapeActionType): string => {
  switch (type) {
    case 'OBSERVATION': return 'Observing'
    case 'ACTION': return 'Acting'
    case 'EXTRACTION': return 'Extracting'
    case 'ANALYSIS': return 'Analyzing'
    case 'NAVIGATION': return 'Navigating'
    case 'CLICK': return 'Clicking'
    case 'WAIT': return 'Waiting'
    default: return 'Processing'
  }
}

export const ActionStream: React.FC<ActionStreamProps> = ({ actions }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [actions])

  if (actions.length === 0) return null

  const latestAction = actions[actions.length - 1]
  const previousActions = actions.slice(0, -1)

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${getActionBgColor(latestAction.type)} border border-border/50`}
      >
        <div className="relative flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${getActionColor(latestAction.type).replace('text-', 'bg-')}`} />
          <div className={`absolute inset-0 w-2 h-2 rounded-full ${getActionColor(latestAction.type).replace('text-', 'bg-')} animate-ping opacity-75`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${getActionColor(latestAction.type)}`}>
              {getActionLabel(latestAction.type)}
            </span>
            <span className="animate-pulse text-muted-foreground">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </span>
          </div>
          <p className="text-sm text-foreground/90 truncate">{latestAction.message}</p>
        </div>
      </div>

      {previousActions.length > 0 && (
        <div ref={containerRef} className="max-h-32 overflow-y-auto space-y-1 pl-2 border-l-2 border-border/30">
          {previousActions.map((action, index) => (
            <div
              key={`${action.timestamp}-${index}`}
              className="flex items-start gap-2 text-xs text-muted-foreground/70 py-0.5 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className={`flex-shrink-0 ${getActionColor(action.type)} opacity-60`}>
                ✓
              </span>
              <span className="truncate">{action.message}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
