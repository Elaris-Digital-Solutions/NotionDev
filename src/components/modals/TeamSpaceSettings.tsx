import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TeamSpace, TeamSpaceMember } from "@/types/workspace";
import { Trash, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";

interface TeamSpaceSettingsProps {
  teamSpace: TeamSpace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamSpaceSettings({ teamSpace, open, onOpenChange }: TeamSpaceSettingsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');

  // Fetch members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['teamspace_members', teamSpace.id],
    queryFn: async () => {
      // 1. Fetch relations safely
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamSpace.id);

      if (error) throw error;

      // 2. Fetch profiles safely if possible
      const userIds = teamMembers.map((m: any) => m.user_id);
      let profilesMap: Record<string, any> = {};

      try {
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);

          profiles?.forEach(p => { profilesMap[p.id] = p; });
        }
      } catch (err) {
        console.warn("Could not fetch profiles", err);
      }

      // 3. Merge data
      return teamMembers.map((m: any) => ({
        ...m,
        id: m.team_id + m.user_id, // Composite key fallback
        role: m.role,
        user: profilesMap[m.user_id] || { email: `User ${m.user_id.slice(0, 4)}...` }
      })) as TeamSpaceMember[];
    },
    enabled: open
  });

  const addMember = useMutation({
    mutationFn: async () => {
      // 1. Find user by email (requires profiles table or similar)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .single();

      if (profileError || !profiles) throw new Error("User not found");

      // 2. Add to team_members
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamSpace.id,
          user_id: profiles.id,
          role: inviteRole
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamspace_members', teamSpace.id] });
      setInviteEmail("");
      toast.success("Member added");
    },
    onError: (err) => toast.error(err.message)
  });

  const updateRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string, role: string }) => {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('team_id', teamSpace.id) // Composite key update needed usually, but using what we have
        .eq('user_id', memberId); // memberId passed in mutation invocation needs to be user_id actually
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamspace_members', teamSpace.id] });
      toast.success("Role updated");
    }
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamSpace.id)
        .eq('user_id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamspace_members', teamSpace.id] });
      toast.success("Member removed");
    }
  });

  const currentUserRole = members.find(m => m.user_id === user?.id)?.role;
  const isOwner = currentUserRole === 'owner';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Teamspace Settings: {teamSpace.name}</DialogTitle>
          <DialogDescription>Manage members and permissions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invite Section */}
          {isOwner && (
            <div className="flex items-end gap-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Label>Invite by Email</Label>
                <Input
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => addMember.mutate()} disabled={!inviteEmail}>
                <UserPlus className="w-4 h-4 mr-2" /> Invite
              </Button>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" /> Members
            </h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 border rounded bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                      {member.user?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{member.user?.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                    </div>
                  </div>

                  {isOwner && member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(val) => updateRole.mutate({ memberId: member.user_id, role: val })}
                      >
                        <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeMember.mutate(member.user_id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {(!isOwner || member.role === 'owner') && (
                    <div className="text-sm text-muted-foreground px-3">
                      {member.role}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
