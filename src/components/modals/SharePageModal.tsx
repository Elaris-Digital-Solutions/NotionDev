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

  // Fetch page details (for public status) and permissions
  const { data: pageData } = useQuery({
    queryKey: ['page_share', pageId],
    queryFn: async () => {
      const { data: page } = await supabase
        .from('pages')
        .select('is_public')
        .eq('id', pageId)
        .single();
      
      const { data: permissions } = await supabase
        .from('page_permissions')
        .select('*, user:profiles(email)')
        .eq('page_id', pageId);

      return { page, permissions: permissions as PagePermission[] };
    },
    enabled: open
  });

  const togglePublic = useMutation({
    mutationFn: async (isPublic: boolean) => {
      const { error } = await supabase
        .from('pages')
        .update({ is_public: isPublic })
        .eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_share', pageId] });
      toast.success("Public access updated");
    }
  });

  const addPermission = useMutation({
    mutationFn: async () => {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .single();
      
      if (profileError || !profiles) throw new Error("User not found");

      const { error } = await supabase
        .from('page_permissions')
        .upsert({
          page_id: pageId,
          user_id: profiles.id,
          role: inviteRole
        });

      if (error) throw error;
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
      const { error } = await supabase
        .from('page_permissions')
        .delete()
        .eq('id', permissionId);
      if (error) throw error;
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
          {/* Public Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Share to web</div>
                <div className="text-xs text-muted-foreground">
                  {pageData?.page?.is_public ? "Anyone with the link can view" : "Only invited people can access"}
                </div>
              </div>
            </div>
            <Switch 
              checked={pageData?.page?.is_public} 
              onCheckedChange={(checked) => togglePublic.mutate(checked)}
            />
          </div>

          {pageData?.page?.is_public && (
            <div className="flex gap-2">
              <Input readOnly value={`${window.location.origin}/page/${pageId}`} className="text-xs" />
              <Button size="icon" variant="outline" onClick={copyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="border-t my-4" />

          {/* Invite Section */}
          <div className="flex gap-2">
            <Input 
              placeholder="Email address" 
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_access">Full Access</SelectItem>
                <SelectItem value="can_edit">Can Edit</SelectItem>
                <SelectItem value="can_comment">Can Comment</SelectItem>
                <SelectItem value="can_view">Can View</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => addPermission.mutate()} disabled={!inviteEmail}>Invite</Button>
          </div>

          {/* Permissions List */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {pageData?.permissions?.map((perm) => (
              <div key={perm.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    {perm.user?.email?.[0].toUpperCase()}
                  </div>
                  <span>{perm.user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs capitalize">
                    {perm.role.replace('_', ' ')}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => removePermission.mutate(perm.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
