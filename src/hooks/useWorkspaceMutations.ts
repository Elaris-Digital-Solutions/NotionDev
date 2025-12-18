import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';

export function useWorkspaceMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createTeamSpace = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');

      // 1. Create the team space
      // @ts-ignore
      const { data: teamSpace, error: teamError } = await supabase
        .from('team_spaces')
        .insert([{ name, owner_id: user.id, icon: '👥' }])
        .select()
        .single();

      if (teamError) throw teamError;

      // 2. Add the creator as a member (owner)
      // @ts-ignore
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{ team_id: teamSpace.id, user_id: user.id, role: 'owner' }]);

      if (memberError) throw memberError;

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
        .insert([
          {
            title,
            owner_id: user.id,
            team_space_id: teamSpaceId || null,
            type: 'blank',
            icon: '📄',
            in_trash: false
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
        .update({ in_trash: true })
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
        .update({ in_trash: false })
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
