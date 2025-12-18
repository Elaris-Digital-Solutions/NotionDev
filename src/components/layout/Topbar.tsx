import { useState } from "react";
import { Search, Plus, Bell, ChevronLeft, ChevronRight, Star, MoreHorizontal, Home, Calendar, Inbox, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceMutations } from "@/hooks/useWorkspaceMutations";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SharePageModal } from "@/components/modals/SharePageModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/AuthProvider";

interface TopbarProps {
  breadcrumb?: string[];
  pageId?: string;
  onPageChange?: (pageId: string) => void;
}

export function Topbar({ breadcrumb = ['Workspace', 'Page'], pageId, onPageChange }: TopbarProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const { createPage } = useWorkspaceMutations();

  const handleCreatePage = async () => {
    const newPage = await createPage.mutateAsync({});
    if (newPage && onPageChange) {
      onPageChange(newPage.id);
    }
  };

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

      {/* Center Section: Spacer (Search removed as it was non-functional, use Sidebar search) */}
      <div className="flex-1" />

      {/* Right Section: Actions */}
      <div className="flex items-center gap-1">
        {pageId && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setShareOpen(true)}
            >
              <Share className="w-3 h-3" />
              <span className="text-xs">Share</span>
            </Button>
            <div className="h-4 w-[1px] bg-border mx-1" />
            <SharePageModal pageId={pageId} open={shareOpen} onOpenChange={setShareOpen} />
          </>
        )}

        <Button
          size="sm"
          className="h-7 px-2 gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleCreatePage}
        >
          <Plus className="w-3 h-3" />
          <span className="text-xs font-medium">New Page</span>
        </Button>

        <div className="ml-2">
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}

function UserAvatar() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <Avatar className="w-7 h-7">
      <AvatarImage src={user.user_metadata?.avatar_url} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}
