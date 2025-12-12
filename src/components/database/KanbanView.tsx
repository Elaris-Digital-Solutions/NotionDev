import { mockProjects } from "@/data/mockData";
import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Status } from "@/types/workspace";

const columns: { id: Status; label: string }[] = [
  { id: 'not-started', label: 'Not Started' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'blocked', label: 'Blocked' },
];

export function KanbanView() {
  return (
    <div className="flex-1 overflow-x-auto px-8 pb-8">
      <div className="flex gap-4 min-w-max h-full">
        {columns.map((col) => (
          <div key={col.id} className="w-72 flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={col.id} />
              <span className="text-xs text-muted-foreground">
                {mockProjects.filter(p => p.status === col.id).length}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              {mockProjects
                .filter((p) => p.status === col.id)
                .map((project) => (
                  <Card key={project.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-sm font-medium leading-tight">
                        {project.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 space-y-2">
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <PriorityBadge priority={project.priority} />
                        {project.progress > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {project.progress}%
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm p-1">
                    <span className="text-lg">+</span> New
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
