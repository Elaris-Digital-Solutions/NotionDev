import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, showLabel = true, className }: ProgressBarProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground w-8">{value}%</span>
      )}
      <Progress value={value} className="h-1.5 flex-1 bg-secondary" />
    </div>
  );
}
