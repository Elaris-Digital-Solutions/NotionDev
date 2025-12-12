import { Search, Plus, Bell, ChevronLeft, ChevronRight, Star, MoreHorizontal, Home, Calendar, Inbox } from "lucide-react";
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
      {/* Left Section: Navigation & Breadcrumbs */}
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
        <nav className="flex items-center gap-1 text-sm hidden md:flex">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <button className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-accent transition-colors">
                {index === 0 && <span>🏠</span>}
                <span className={index === breadcrumb.length - 1 ? "text-foreground" : "text-muted-foreground"}>
                  {item}
                </span>
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Center Section: Global Search */}
      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="h-8 pl-8 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
          <Home className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
          <Calendar className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-foreground">
          <Inbox className="w-4 h-4" />
        </Button>
        
        <div className="h-4 w-[1px] bg-border mx-1" />

        <Button size="sm" className="h-7 px-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-3 h-3" />
          <span className="text-xs font-medium">New Page</span>
        </Button>

        <div className="ml-2">
          <Avatar className="w-7 h-7">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
