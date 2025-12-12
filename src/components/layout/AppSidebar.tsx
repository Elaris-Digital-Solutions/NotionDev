import { useState } from "react";
import {
  Search,
  Home,
  Calendar,
  Bell,
  Inbox,
  ChevronDown,
  Settings,
  ShoppingBag,
  ChevronRight,
  Plus,
  MoreHorizontal,
  FileText,
  CheckSquare,
  Users,
  PenLine,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function AppSidebar({ currentPage, onPageChange }: SidebarProps) {
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [teamspacesOpen, setTeamspacesOpen] = useState(true);
  const [privateOpen, setPrivateOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  
  const { pages, teamSpaces, favorites, isLoading } = useWorkspace();

  if (isLoading) {
    return <div className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex items-center justify-center text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <aside className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Workspace Header */}
      <div className="p-3 border-b border-sidebar-border">
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            E
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground">ELARIS Digital Sol...</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Main Navigation */}
          <nav className="space-y-0.5">
            <NavItem 
              icon={Search} 
              label="Search" 
              onClick={() => {}} 
            />
            <NavItem 
              icon={Home} 
              label="Home" 
              active={currentPage === 'home'}
              onClick={() => onPageChange('home')} 
            />
            <NavItem 
              icon={Calendar} 
              label="Meetings" 
              badge="New"
              onClick={() => onPageChange('meetings')} 
              active={currentPage === 'meetings'}
            />
            <NavItem 
              icon={Inbox} 
              label="Inbox" 
              count={6}
              onClick={() => onPageChange('inbox')} 
              active={currentPage === 'inbox'}
            />
          </nav>

          {/* Favorites Section */}
          <Collapsible open={favoritesOpen} onOpenChange={setFavoritesOpen} className="mt-6">
            <CollapsibleTrigger className="flex items-center gap-1 px-2 py-1 w-full text-xs font-medium text-muted-foreground hover:text-sidebar-foreground">
              <ChevronRight className={cn("w-3 h-3 transition-transform", favoritesOpen && "rotate-90")} />
              Favorites
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {favorites.map((page) => (
                <NavItem
                  key={page.id}
                  icon={getPageIcon(page.icon)}
                  label={page.title}
                  emoji={page.icon}
                  onClick={() => onPageChange(page.id)}
                  active={currentPage === page.id}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Teamspaces Section */}
          <Collapsible open={teamspacesOpen} onOpenChange={setTeamspacesOpen} className="mt-6">
            <CollapsibleTrigger className="flex items-center gap-1 px-2 py-1 w-full text-xs font-medium text-muted-foreground hover:text-sidebar-foreground">
              <ChevronRight className={cn("w-3 h-3 transition-transform", teamspacesOpen && "rotate-90")} />
              Teamspaces
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              {teamSpaces.map((space) => (
                <TeamSpaceItem
                  key={space.id}
                  space={space}
                  currentPage={currentPage}
                  onPageChange={onPageChange}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Private Section */}
          <Collapsible open={privateOpen} onOpenChange={setPrivateOpen} className="mt-6">
            <CollapsibleTrigger className="flex items-center gap-1 px-2 py-1 w-full text-xs font-medium text-muted-foreground hover:text-sidebar-foreground">
              <ChevronRight className={cn("w-3 h-3 transition-transform", privateOpen && "rotate-90")} />
              Private
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {pages.map((page) => (
                <NavItem
                  key={page.id}
                  icon={getPageIcon(page.icon)}
                  label={page.title}
                  emoji={page.icon}
                  onClick={() => onPageChange(page.id)}
                  active={currentPage === page.id}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Templates Section */}
          <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen} className="mt-6">
            <CollapsibleTrigger className="flex items-center gap-1 px-2 py-1 w-full text-xs font-medium text-muted-foreground hover:text-sidebar-foreground">
              <ChevronRight className={cn("w-3 h-3 transition-transform", templatesOpen && "rotate-90")} />
              Templates
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {/* Templates would be fetched similarly, for now empty or static */}
              <div className="px-2 py-1 text-xs text-muted-foreground">No templates</div>
            </CollapsibleContent>
          </Collapsible>

        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-2 border-t border-sidebar-border space-y-0.5">
        <NavItem icon={Settings} label="Settings" onClick={() => {}} />
        <NavItem icon={ShoppingBag} label="Marketplace" onClick={() => {}} />
        <NavItem icon={Plus} label="New Page" onClick={() => {}} />
      </div>
    </aside>
  );
}

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  emoji?: string;
  active?: boolean;
  badge?: string;
  count?: number;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, emoji, active, badge, count, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors group",
        active 
          ? "bg-sidebar-accent text-sidebar-accent-foreground" 
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      {emoji ? (
        <span className="w-5 text-center">{emoji}</span>
      ) : (
        <Icon className="w-4 h-4 text-muted-foreground" />
      )}
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-info text-info-foreground rounded">
          {badge}
        </span>
      )}
      {count !== undefined && (
        <span className="w-5 h-5 flex items-center justify-center text-xs bg-destructive text-destructive-foreground rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

interface TeamSpaceItemProps {
  space: any; // Using any for now to bypass strict type checking against mock types
  currentPage: string;
  onPageChange: (page: string) => void;
}

function TeamSpaceItem({ space, currentPage, onPageChange }: TeamSpaceItemProps) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
        <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
        <span>{space.icon}</span>
        <span className="flex-1 text-left truncate font-medium">{space.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-3 space-y-0.5 mt-0.5">
        {space.pages?.map((page: any) => (
          <NavItem
            key={page.id}
            icon={FileText}
            label={page.title}
            emoji={page.icon}
            onClick={() => onPageChange(page.id)}
            active={currentPage === page.id}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function getPageIcon(emoji?: string): React.ComponentType<{ className?: string }> {
  switch (emoji) {
    case '✅': return CheckSquare;
    case '👥': return Users;
    case '✏️': return PenLine;
    default: return FileText;
  }
}
