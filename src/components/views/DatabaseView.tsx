import { useState } from "react";
import { 
  Star, 
  LayoutGrid, 
  List, 
  Kanban, 
  GanttChart, 
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
  Settings,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewType } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { TableView } from "@/components/database/TableView";
import { KanbanView } from "@/components/database/KanbanView";
import { ListView } from "@/components/database/ListView";
import { GalleryView } from "@/components/database/GalleryView";
import { CalendarView } from "@/components/database/CalendarView";

const views: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'table', label: 'Table', icon: Star },
  { id: 'kanban', label: 'Board', icon: Kanban },
  { id: 'list', label: 'List', icon: List },
  { id: 'gallery', label: 'Gallery', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

import { useDatabase } from "@/hooks/useDatabase";
import { usePageMutations } from "@/hooks/usePageMutations";

export function DatabaseView({ title = "Database", icon = "🔍", pageId }: { title?: string; icon?: string; pageId: string }) {
  const [currentView, setCurrentView] = useState<ViewType>('table');
  const { rows, properties, isLoading } = useDatabase(pageId);
  const { createChildPage } = usePageMutations(pageId);

  const renderView = () => {
    if (isLoading) return <div className="p-8">Loading database...</div>;

    switch (currentView) {
      case 'table': return <TableView rows={rows} properties={properties} />;
      case 'kanban': return <KanbanView rows={rows} properties={properties} />;
      case 'list': return <ListView rows={rows} properties={properties} />;
      case 'gallery': return <GalleryView rows={rows} properties={properties} />;
      case 'calendar': return <CalendarView rows={rows} properties={properties} />;
      default: return <TableView rows={rows} properties={properties} />;
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col animate-fade-up">
      {/* Page Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{icon}</span>
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1 border-b border-border pb-2">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                  currentView === view.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {view.label}
              </button>
            );
          })}

          <div className="flex-1" />

          {/* View Controls */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <Filter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <ArrowUpDown className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-7 h-7">
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" className="gap-1 ml-2" onClick={() => createChildPage.mutate('Untitled')}>
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {renderView()}
    </div>
  );
}
