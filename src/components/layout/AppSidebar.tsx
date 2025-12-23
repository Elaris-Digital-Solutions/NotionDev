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
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkspaceMutations } from "@/hooks/useWorkspaceMutations";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function AppSidebar({ currentPage, onPageChange }: SidebarProps) {
  const { user } = useAuth();
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [teamspacesOpen, setTeamspacesOpen] = useState(true);
  const [privateOpen, setPrivateOpen] = useState(true);
  const [templatesOpen, setTemplatesOpen] = useState(true);
  
  const [isTeamSpaceDialogOpen, setIsTeamSpaceDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [newTeamSpaceName, setNewTeamSpaceName] = useState("");

  const { pages, teamSpaces, favorites, trash, isLoading } = useWorkspace();
  const { createTeamSpace, createPage, restorePage, permanentlyDeletePage } = useWorkspaceMutations();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user
  });

  const handleCreateTeamSpace = async () => {
    if (!newTeamSpaceName.trim()) return;
    await createTeamSpace.mutateAsync(newTeamSpaceName);
    setNewTeamSpaceName("");
    setIsTeamSpaceDialogOpen(false);
  };

  const handleCreatePage = async (teamSpaceId?: string) => {
    const newPage = await createPage.mutateAsync({ teamSpaceId }) as Page; // Explicitly cast to Page
    if (newPage) {
      onPageChange(newPage.id);
    }
  };

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
              onClick={() => onPageChange('meetings')} 
              active={currentPage === 'meetings'}
            />
            <NavItem 
              icon={Inbox} 
              label="Inbox" 
              count={unreadCount > 0 ? unreadCount : undefined}
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
            <div className="flex items-center justify-between px-2 py-1 group/header">
              <CollapsibleTrigger className="flex items-center gap-1 w-full text-xs font-medium text-muted-foreground hover:text-sidebar-foreground">
                <ChevronRight className={cn("w-3 h-3 transition-transform", teamspacesOpen && "rotate-90")} />
                Teamspaces
              </CollapsibleTrigger>
              <Dialog open={isTeamSpaceDialogOpen} onOpenChange={setIsTeamSpaceDialogOpen}>
                <DialogTrigger asChild>
                  <button className="opacity-0 group-hover/header:opacity-100 hover:bg-sidebar-accent rounded p-0.5 text-muted-foreground hover:text-foreground transition-all">
                    <Plus className="w-3 h-3" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create new teamspace</DialogTitle>
                    <DialogDescription>
                      Teamspaces are where your team organizes pages, permissions, and members.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newTeamSpaceName}
                        onChange={(e) => setNewTeamSpaceName(e.target.value)}
                        placeholder="Acme Corp."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTeamSpaceDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTeamSpace} disabled={!newTeamSpaceName.trim()}>Create teamspace</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
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
            <div className="flex items-center justify-between px-2 py-1 group/header">
              <CollapsibleTrigger className="flex items-center gap-1 w-full text-xs font-medium text-muted-foreground hover:text-sidebar-foreground">
                <ChevronRight className={cn("w-3 h-3 transition-transform", privateOpen && "rotate-90")} />
                Private
              </CollapsibleTrigger>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreatePage();
                }}
                className="opacity-0 group-hover/header:opacity-100 hover:bg-sidebar-accent rounded p-0.5 text-muted-foreground hover:text-foreground transition-all"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
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
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <NavItem icon={Settings} label="Settings" onClick={() => setIsSettingsOpen(true)} />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Manage your account and workspace settings.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-xs text-muted-foreground">Toggle dark mode theme</p>
                </div>
                {/* Switch would go here */}
                <div className="text-xs text-muted-foreground">System</div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-xs text-muted-foreground">Manage email notifications</p>
                </div>
                <div className="text-xs text-muted-foreground">Enabled</div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsSettingsOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isTrashOpen} onOpenChange={setIsTrashOpen}>
          <DialogTrigger asChild>
            <NavItem icon={Trash} label="Trash" onClick={() => setIsTrashOpen(true)} />
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Trash</DialogTitle>
              <DialogDescription>
                Pages in trash for you.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {trash.length === 0 && <div className="text-center text-muted-foreground py-8">Trash is empty</div>}
                {trash.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
                    <div className="flex items-center gap-2">
                      <span>{page.icon || '📄'}</span>
                      <span>{page.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => restorePage.mutate(page.id)}>Restore</Button>
                      <Button size="sm" variant="destructive" onClick={() => permanentlyDeletePage.mutate(page.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <NavItem icon={ShoppingBag} label="Marketplace" onClick={() => {}} />
        <NavItem icon={Plus} label="New Page" onClick={() => handleCreatePage()} />
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

import { TeamSpace } from "@/types/workspace";
import { TeamSpaceSettings } from "@/components/modals/TeamSpaceSettings";

interface TeamSpaceItemProps {
  space: TeamSpace;
  currentPage: string;
  onPageChange: (page: string) => void;
}

function TeamSpaceItem({ space, currentPage, onPageChange }: TeamSpaceItemProps) {
  const [open, setOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { createPage } = useWorkspaceMutations();

  const handleCreatePage = async () => {
    const newPage = await createPage.mutateAsync({ teamSpaceId: space.id });
    if (newPage) {
      onPageChange(newPage.id);
      setOpen(true);
    }
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-sidebar-accent/50 transition-colors group/item">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-sidebar-foreground w-full">
            <ChevronRight className={cn("w-3 h-3 transition-transform", open && "rotate-90")} />
            <span>{space.icon}</span>
            <span className="flex-1 text-left truncate font-medium">{space.name}</span>
          </CollapsibleTrigger>
          <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen(true);
              }}
              className="hover:bg-sidebar-accent rounded p-0.5 text-muted-foreground hover:text-foreground transition-all mr-1"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCreatePage();
              }}
              className="hover:bg-sidebar-accent rounded p-0.5 text-muted-foreground hover:text-foreground transition-all"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
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
      <TeamSpaceSettings 
        teamSpace={space} 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </>
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
