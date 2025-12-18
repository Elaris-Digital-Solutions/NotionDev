import { cn } from "@/lib/utils";
import { Status, Priority } from "@/types/workspace";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  'not-started': {
    label: 'Sin empezar',
    className: 'bg-status-not-started/20 text-muted-foreground border-status-not-started/30'
  },
  'in-progress': {
    label: 'En progreso',
    className: 'bg-info/20 text-info border-info/30'
  },
  'completed': {
    label: 'Completado',
    className: 'bg-success/20 text-success border-success/30'
  },
  'blocked': {
    label: 'Bloqueado',
    className: 'bg-destructive/20 text-destructive border-destructive/30'
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status || 'Unknown', className: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
      config.className,
      className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  'high': {
    label: 'Alta',
    className: 'bg-priority-high text-destructive-foreground'
  },
  'medium': {
    label: 'Medio',
    className: 'bg-priority-medium text-warning-foreground'
  },
  'low': {
    label: 'Baja',
    className: 'bg-priority-low text-success-foreground'
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || { label: priority || 'Unknown', className: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
