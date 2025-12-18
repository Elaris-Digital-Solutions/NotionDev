import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';

export function useWorkspaceMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createTeamSpace = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');

      // 0. Ensure profile exists (Best effort)
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!profile) {
          // Insert profile if missing
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.warn('Profile sync warning:', profileError);
            // Do not throw, allow team creation to proceed even if profile sync fails
          }
        }
      } catch (err) {
        console.warn('Profile check failed, proceeding anyway:', err);
      }

      // 1. Create the team space
      // @ts-ignore
      const { data: teamSpace, error: teamError } = await supabase
        .from('team_spaces')
        // @ts-ignore
        .insert([{ name, owner_id: user.id, icon: '👥' }])
        .select()
        .single();

      if (teamError) throw teamError;
      if (!teamSpace) throw new Error('Failed to create team space');

      // 2. Add the creator as a member (owner)
      // @ts-ignore
      const { error: memberError } = await supabase
        .from('team_members')
        // @ts-ignore
        .insert([{ team_id: teamSpace.id, user_id: user.id, role: 'owner' }]);

      if (memberError) {
        console.error("Failed to add owner to team:", memberError);
        // Don't throw here? Or do? If we created teamSpace but failed to add member, we have an orphan team.
        // Throw so mutation fails.
        throw memberError;
      }

      return teamSpace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSpaces'] });
    },
  });

  const createPage = useMutation({
    mutationFn: async ({ title = 'Untitled', teamSpaceId }: { title?: string; teamSpaceId?: string }) => {
      if (!user) throw new Error('User not authenticated');

      // @ts-ignore
      const { data, error } = await supabase
        .from('pages')
        // @ts-ignore
        .insert([
          {
            title,
            owner_id: user.id,
            team_space_id: teamSpaceId || null,
            type: 'blank',
            icon: '📄',
            // in_trash: false // Column does not exist
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['teamSpaces'] });
    },
  });

  const deletePage = useMutation({
    mutationFn: async (pageId: string) => {
      // @ts-ignore
      const { error } = await supabase
        .from('pages')
        .delete() // Hard delete since soft delete (in_trash) is not supported
        .eq('id', pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['teamSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });

  const restorePage = useMutation({
    mutationFn: async (pageId: string) => {
      // @ts-ignore
      const { error } = await supabase
        .from('pages')
        // .update({ in_trash: false }) // Cannot restore
        .select('id') // No-op
        .eq('id', pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      queryClient.invalidateQueries({ queryKey: ['teamSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });

  const permanentlyDeletePage = useMutation({
    mutationFn: async (pageId: string) => {
      // @ts-ignore
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
    },
  });

  return {
    createTeamSpace,
    createPage,
    deletePage,
    restorePage,
    permanentlyDeletePage
  };
}
