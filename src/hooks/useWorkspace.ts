import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';
import { Page } from '@/types/workspace';
import { queryKeys } from '@/lib/queryKeys';

export function useWorkspace() {
  const { user } = useAuth();

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: queryKeys.sidebar.root(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('owner_id', user.id)
        .is('team_space_id', null) // Private pages
        .is('parent_id', null) // Only Root Pages
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Page[];
    },
    enabled: !!user,
    placeholderData: (previousData) => previousData, // Avoid white screen on refetch
  });

  const { data: teamSpaces, isLoading: teamsLoading } = useQuery({
    queryKey: queryKeys.sidebar.teamSpaces(user?.id),
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data: members, error: memberError } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id);

        if (memberError) {
          console.warn('Failed to fetch team members:', memberError);
          return [];
        }

        // @ts-ignore
        const teamIds = (members || []).map((m: any) => m.team_id);

        if (teamIds.length === 0) return [];

        const { data: teams, error: teamsError } = await supabase
          .from('team_spaces')
          .select(`
            *,
            pages (*)
          `)
          .in('id', teamIds);

        if (teamsError) {
          console.warn('Failed to fetch team spaces:', teamsError);
          return [];
        }

        return teams;
      } catch (err) {
        console.error('Error loading team spaces:', err);
        return [];
      }
    },
    enabled: !!user,
    retry: false,
    placeholderData: (previousData) => previousData,
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: queryKeys.sidebar.favorites(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('is_favorite', true)
        .eq('owner_id', user.id);

      if (error) throw error;
      return data as Page[];
    },
    enabled: !!user,
    placeholderData: (previousData) => previousData,
  });

  const { data: trash, isLoading: trashLoading } = useQuery({
    queryKey: queryKeys.sidebar.trash(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('owner_id', user.id)
        .limit(0);

      if (error) throw error;
      return data as Page[];
    },
    enabled: !!user,
    placeholderData: (previousData) => previousData,
  });

  return {
    pages: pages || [],
    teamSpaces: teamSpaces || [],
    favorites: favorites || [],
    trash: trash || [],
    isLoading: (pagesLoading || teamsLoading) && !pages && !teamSpaces,
  };
}
