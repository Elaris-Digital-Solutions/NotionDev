import { Search, Plus, Bell, ChevronLeft, ChevronRight, Star, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  breadcrumb?: string[];
}

export function Topbar({ breadcrumb = ['ELARIS D.S.', 'Clientes Potenciales'] }: TopbarProps) {
  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-3 gap-4">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <button className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-accent transition-colors">
                {index === 0 && <span>🏠</span>}
                {index === 1 && <span>🔍</span>}
                <span className={index === breadcrumb.length - 1 ? "text-foreground" : "text-muted-foreground"}>
                  {item}
                </span>
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden md:block">Edited 14h ago</span>
        
        <div className="flex items-center -space-x-1.5">
          <Avatar className="w-6 h-6 border-2 border-background">
            <AvatarFallback className="text-[10px] bg-info">F</AvatarFallback>
          </Avatar>
          <Avatar className="w-6 h-6 border-2 border-background">
            <AvatarFallback className="text-[10px] bg-success">S</AvatarFallback>
          </Avatar>
        </div>

        <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
          Share
        </Button>

        <Button variant="ghost" size="icon" className="w-7 h-7">
          <Star className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="w-7 h-7">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
