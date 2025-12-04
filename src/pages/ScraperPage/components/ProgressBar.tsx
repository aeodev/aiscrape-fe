interface ProgressBarProps {
  message: string;
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ message, progress }) => {
  return (
    <div className="border-t border-border bg-card/50 px-6 py-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{message}</span>
          <span className="text-xs font-medium text-foreground">{progress}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1 overflow-hidden">
          <div
            className="bg-foreground h-1 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};







