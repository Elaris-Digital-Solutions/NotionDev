import { mockProjects } from "@/data/mockData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CalendarView() {
  // Mock calendar grid
  const days = Array.from({ length: 35 }, (_, i) => i + 1);
  
  return (
    <div className="flex-1 overflow-auto px-8 pb-8 flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Today</Button>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight className="w-4 h-4" /></Button>
                </div>
                <span className="font-medium">December 2025</span>
            </div>
        </div>

      <div className="flex-1 border border-border rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground border-r border-border last:border-r-0">
                    {day}
                </div>
            ))}
        </div>
        
        {/* Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5">
            {days.map((day, i) => {
                const date = i - 2; // Offset to start month correctly (mock)
                const displayDate = date > 0 && date <= 31 ? date : '';
                const projectsOnDay = mockProjects.filter(p => p.createdAt.getDate() === displayDate);

                return (
                    <div key={i} className="border-r border-b border-border p-1 min-h-[100px] relative group">
                        <span className={`text-xs p-1 ${displayDate === 12 ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : 'text-muted-foreground'}`}>
                            {displayDate}
                        </span>
                        
                        <div className="mt-1 space-y-1">
                            {projectsOnDay.map(project => (
                                <div key={project.id} className="text-[10px] bg-accent/50 p-1 rounded truncate cursor-pointer hover:bg-accent">
                                    {project.name}
                                </div>
                            ))}
                        </div>
                        
                        <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground">
                            +
                        </button>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
