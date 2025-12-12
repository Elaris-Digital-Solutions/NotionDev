import { mockProjects } from "@/data/mockData";
import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { FileText } from "lucide-react";

export function ListView() {
  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-w-3xl mx-auto">
      <div className="space-y-1">
        {mockProjects.map((project) => (
          <div 
            key={project.id}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer group"
          >
            <div className="p-1 rounded bg-muted text-muted-foreground">
                <FileText className="w-4 h-4" />
            </div>
            <span className="flex-1 font-medium text-sm">{project.name}</span>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
                <span className="text-xs text-muted-foreground">
                    {project.createdAt.toLocaleDateString()}
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
