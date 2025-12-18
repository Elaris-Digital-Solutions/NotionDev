import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PagePermission } from "@/types/workspace";
import { Globe, Copy, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

interface SharePageModalProps {
  pageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharePageModal({ pageId, open, onOpenChange }: SharePageModalProps) {
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'full_access' | 'can_edit' | 'can_comment' | 'can_view'>('can_view');

  // Fetch page details (safe mode)
  const { data: pageData } = useQuery({
    queryKey: ['page_share', pageId],
    queryFn: async () => {
      // Return mock data since backend tables are missing
      return {
        page: { is_public: false },
        permissions: [] as PagePermission[]
      };
    },
    enabled: open
  });

  const togglePublic = useMutation({
    mutationFn: async (isPublic: boolean) => {
      // Feature disabled
      throw new Error("Feature unavailable");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_share', pageId] });
      toast.success("Public access updated");
    }
  });

  const addPermission = useMutation({
    mutationFn: async () => {
      // Feature disabled
      throw new Error("Feature unavailable");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_share', pageId] });
      setInviteEmail("");
      toast.success("User invited");
    },
    onError: (err) => toast.error(err.message)
  });

  const removePermission = useMutation({
    mutationFn: async (permissionId: string) => {
      // Feature disabled
      throw new Error("Feature unavailable");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_share', pageId] });
      toast.success("Access removed");
    }
  });

  const copyLink = () => {
    const url = `${window.location.origin}/page/${pageId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Page</DialogTitle>
          <DialogDescription>Manage access and visibility.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feature Status */}
          <div className="p-4 border rounded-lg bg-muted/50 text-center space-y-2">
            <div className="p-2 bg-primary/10 rounded-full w-fit mx-auto text-primary">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-medium">Sharing Unavailable</h3>
            <p className="text-sm text-muted-foreground">
              Page sharing and public access are currently disabled due to system updates.
            </p>
          </div>

          {/* 
            Legacy/Planned UI Implementation
            Disabled until schema supports pages.is_public and page_permissions table
          */}
          <div className="hidden">
            {/* Original UI logic preserved in comments for future restoration if schema is updated */}
            {/* ... */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
