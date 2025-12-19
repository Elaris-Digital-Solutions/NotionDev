import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';
import { queryKeys } from '@/lib/queryKeys';
import { Page } from '@/types/workspace';

export function useWorkspaceMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const deleteTeamSpace = useMutation({
    mutationFn: async (teamSpaceId: string) => {
      // @ts-ignore
      const { error } = await supabase.from('team_spaces').delete().eq('id', teamSpaceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebar.teamSpaces(user?.id) });
    },
  });

  const createTeamSpace = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');

      // Best effort profile check
      try {
        const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
        if (!profile) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) { console.warn(e); }

      // @ts-ignore
      const { data: teamSpace, error: teamError } = await supabase.from('team_spaces').insert([{ name, owner_id: user.id, icon: '👥' }]).select().single();
      if (teamError) throw teamError;

      // @ts-ignore
      await supabase.from('team_members').insert([{ team_id: teamSpace.id, user_id: user.id, role: 'owner' }]);
      return teamSpace;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebar.teamSpaces(user?.id) });
    },
  });

  const createPage = useMutation({
    mutationFn: async ({ title = 'Untitled', teamSpaceId, parentId }: { title?: string; teamSpaceId?: string; parentId?: string }) => {
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
            parent_id: parentId || null,
            type: 'blank',
            icon: '📄',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data as Page;
    },
    onSuccess: (newPage, variables) => {
      if (variables.parentId) {
        queryClient.setQueryData(queryKeys.sidebar.children(variables.parentId), (old: Page[] | undefined) => {
          return old ? [...old, newPage] : [newPage];
        });
        // Force root refresh if needed, but children update is key
      } else if (variables.teamSpaceId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebar.teamSpaces(user?.id) });
      } else {
        queryClient.setQueryData(queryKeys.sidebar.root(user?.id), (old: Page[] | undefined) => {
          return old ? [...old, newPage] : [newPage];
        });
      }
    },
  });

  const deletePage = useMutation({
    mutationFn: async (pageId: string) => {
      // @ts-ignore
      const { error } = await supabase.from('pages').delete().eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace() });
    },
  });

  const restorePage = useMutation({
    mutationFn: async (pageId: string) => {
      // No-op
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace() });
    },
  });

  const permanentlyDeletePage = useMutation({
    mutationFn: async (pageId: string) => {
      const { data: page } = await supabase.from('pages').select('title').eq('id', pageId).single();
      if (page?.title === '_System_Properties_DO_NOT_DELETE') {
        throw new Error('SystemPropertyDoNotDelete: Cannot delete the system database.');
      }
      // @ts-ignore
      const { error } = await supabase.from('pages').delete().eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace() });
    },
  });

  return {
    createTeamSpace,
    deleteTeamSpace,
    createPage,
    deletePage,
    restorePage,
    permanentlyDeletePage
  };
}
