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

  const { data: shareData, isLoading } = useQuery({
    queryKey: ['page_share', pageId],
    queryFn: async () => {
      // 1. Fetch Page Visibility
      const { data: page, error: pageError } = await (supabase.from('pages') as any)
        .select('is_public, owner_id')
        .eq('id', pageId)
        .single();

      if (pageError) throw pageError;

      // 2. Fetch Permissions
      const { data: permissions, error: permError } = await (supabase.from('page_permissions') as any)
        .select(`
          id,
          role,
          user_id,
          user:user_id (
            email,
            avatar_url
          )
        `) // cast to any to avoid TS errors with joins
        .eq('page_id', pageId);

      if (permError) throw permError;

      return {
        page: page as { is_public: boolean, owner_id: string },
        permissions: permissions as (PagePermission & { user: { email: string, avatar_url?: string } })[]
      };
    },
    enabled: open && !!pageId
  });

  const togglePublic = useMutation({
    mutationFn: async (isPublic: boolean) => {
      const { error } = await (supabase.from('pages') as any)
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
      // 1. Find user by email (using public.profiles)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail) // This requires profiles to be searchable by email
        .single();

      if (profileError || !profiles) {
        throw new Error("User not found via email search.");
      }

      // 2. Add permission
      const { error } = await (supabase.from('page_permissions') as any)
        .insert({
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
    onError: (error) => {
      toast.error(error.message || "Failed to invite user");
    }
  });

  const removePermission = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await (supabase.from('page_permissions') as any)
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

          {/* Public Access Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium text-sm">Share to web</span>
                <span className="text-xs text-muted-foreground">Anyone with the link can view</span>
              </div>
            </div>
            <Switch
              checked={shareData?.page?.is_public || false}
              onCheckedChange={(checked) => togglePublic.mutate(checked)}
              disabled={isLoading || togglePublic.isPending}
            />
          </div>

          {shareData?.page?.is_public && (
            <div className="flex items-center gap-2">
              <Input readOnly value={`${window.location.origin}/page/${pageId}`} className="h-8 text-xs font-mono" />
              <Button size="sm" variant="outline" className="h-8 px-2" onClick={copyLink}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="h-[1px] bg-border my-2" />

          {/* Invite Section */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                className="flex-1"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_access">Full Access</SelectItem>
                  <SelectItem value="can_edit">Can Edit</SelectItem>
                  <SelectItem value="can_comment">Can Comment</SelectItem>
                  <SelectItem value="can_view">Can View</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => addPermission.mutate()} disabled={addPermission.isPending || !inviteEmail}>
                Invite
              </Button>
            </div>
          </div>

          <div className="h-[1px] bg-border my-2" />

          {/* Permissions List */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase font-semibold">People with access</Label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-2">
                {/* Owner (Simulated for now, normally filtered or added) */}
                {/* <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">O</div>
                     <span>Owner</span>
                   </div>
                   <span className="text-muted-foreground text-xs">Owner</span>
                 </div> */}

                {shareData?.permissions?.map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between text-sm group">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] overflow-hidden">
                        {perm.user?.avatar_url ? (
                          <img src={perm.user.avatar_url} alt={perm.user.email} className="w-full h-full object-cover" />
                        ) : (
                          perm.user?.email?.[0].toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span>{perm.user?.email || 'Unknown User'}</span>
                        <span className="text-[10px] text-muted-foreground">{perm.role}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => removePermission.mutate(perm.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}

                {shareData?.permissions.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No invites yet.</p>
                )}
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
