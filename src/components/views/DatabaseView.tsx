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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { mockProjects } from "@/data/mockData";
import { ViewType } from "@/types/workspace";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const views: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'table', label: 'Todos los proyectos', icon: Star },
  { id: 'kanban', label: 'Por Estado', icon: Kanban },
  { id: 'list', label: 'Contacto', icon: List },
  { id: 'gallery', label: 'Progreso', icon: LayoutGrid },
  { id: 'calendar', label: 'Gantt', icon: GanttChart },
];

export function DatabaseView() {
  const [currentView, setCurrentView] = useState<ViewType>('table');

  return (
    <div className="flex-1 overflow-hidden flex flex-col animate-fade-up">
      {/* Page Header */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">🔍</span>
          <h1 className="text-4xl font-bold text-foreground">Clientes Potenciales</h1>
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
            <Button size="sm" className="gap-1 ml-2">
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-xs">Aa</span>
                  Nombre del proyecto
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-xs">≡</span>
                  Descripción
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-xs">⚠</span>
                  Problema
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-xs">◎</span>
                  Estado
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-xs">📊</span>
                  Progreso
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-xs">⊙</span>
                  Prioridad
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProjects.map((project, index) => (
              <TableRow 
                key={project.id} 
                className="border-border hover:bg-accent/30 cursor-pointer transition-colors group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="font-medium text-foreground">
                  {project.name}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {project.description}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[300px]">
                  <p className="line-clamp-2 text-sm">{project.problem}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell>
                  <ProgressBar value={project.progress} className="min-w-[100px]" />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={project.priority} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
