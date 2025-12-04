import { Sparkles } from 'lucide-react';
import { ThemeToggle } from '../../../components/ThemeToggle';

interface HeaderProps {
  jobCount: number;
}

export const Header: React.FC<HeaderProps> = ({ jobCount }) => {
  return (
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
                {jobCount} {jobCount === 1 ? 'job' : 'jobs'}
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};
