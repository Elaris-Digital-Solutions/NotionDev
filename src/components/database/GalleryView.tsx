import { mockProjects } from "@/data/mockData";
import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

export function GalleryView() {
  return (
    <div className="flex-1 overflow-auto px-8 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockProjects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden group">
            <div className="h-32 bg-muted w-full object-cover flex items-center justify-center text-muted-foreground">
                {/* Mock Image Placeholder */}
                <span className="text-4xl">🖼️</span>
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium leading-none">{project.name}</h3>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
              {project.progress > 0 && (
                  <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                      </div>
                      <ProgressBar value={project.progress} className="h-1" />
                  </div>
              )}
              <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">A</div>
                  <span>Created {project.createdAt.toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        <button className="h-[300px] border border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors">
            + New
        </button>
      </div>
    </div>
  );
}
