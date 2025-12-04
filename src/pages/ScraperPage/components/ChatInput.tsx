import { Loader2, Send, Settings } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ScraperType } from '../../../types/scraper';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  scraperType: ScraperType;
  setScraperType: (value: ScraperType) => void;
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean) => void;
  blockResources: boolean;
  setBlockResources: (value: boolean) => void;
  includeScreenshots: boolean;
  setIncludeScreenshots: (value: boolean) => void;
  useProxy: boolean;
  setUseProxy: (value: boolean) => void;
  isProcessing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  scraperType,
  setScraperType,
  showAdvanced,
  setShowAdvanced,
  blockResources,
  setBlockResources,
  includeScreenshots,
  setIncludeScreenshots,
  useProxy,
  setUseProxy,
  isProcessing,
  onSubmit,
}) => {
  return (
    <div className="border-t border-border bg-card/50">
      <div className="max-w-4xl mx-auto px-6 py-3">
        <form onSubmit={onSubmit}>
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
  );
};






