import { Sparkles } from 'lucide-react';
import { JobList } from '../../../components/JobList';
import { IScrapeJob } from '../../../types/scraper';

interface ChatSidebarProps {
  jobs: IScrapeJob[];
  selectedJobId?: string;
  onSelectJob: (job: IScrapeJob) => void;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  jobs,
  selectedJobId,
  onSelectJob,
  onNewChat,
}) => {
  return (
    <aside className="w-72 border-r border-border bg-card/50 flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Chats
          </h2>
          <button
            onClick={onNewChat}
            className="h-6 px-2 flex items-center gap-1 bg-foreground text-background hover:opacity-90 rounded text-[10px] font-medium transition-opacity"
            title="New chat"
          >
            <Sparkles className="w-3 h-3" />
            New
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <JobList
          jobs={jobs}
          onSelectJob={onSelectJob}
          selectedJobId={selectedJobId}
        />
      </div>
    </aside>
  );
};
