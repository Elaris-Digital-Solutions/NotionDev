import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/providers/AuthProvider';
import { Page } from '@/types/workspace';

export function useWorkspace() {
  const { user } = useAuth();

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['pages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('owner_id', user.id)
        .is('team_space_id', null) // Private pages
        .eq('in_trash', false)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Page[];
    },
    enabled: !!user,
  });

  const { data: teamSpaces, isLoading: teamsLoading } = useQuery({
    queryKey: ['teamSpaces', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Fetch teams where user is a member
      const { data: members, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);
      
      if (memberError) throw memberError;
      
      const teamIds = members.map(m => m.team_id);
      
      if (teamIds.length === 0) return [];

      const { data: teams, error: teamsError } = await supabase
        .from('team_spaces')
        .select(`
          *,
          pages (*)
        `)
        .in('id', teamIds);

      if (teamsError) throw teamsError;
      
      // Filter out trashed pages from team spaces
      return teams.map(team => ({
        ...team,
        pages: team.pages.filter((p: any) => !p.in_trash)
      }));
    },
    enabled: !!user,
  });

  const { data: favorites, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('is_favorite', true)
        .eq('owner_id', user.id)
        .eq('in_trash', false);
      
      if (error) throw error;
      return data as Page[];
    },
    enabled: !!user,
  });

  const { data: trash, isLoading: trashLoading } = useQuery({
    queryKey: ['trash', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('owner_id', user.id)
        .eq('in_trash', true)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      return data as Page[];
    },
    enabled: !!user,
  });

  return {
    pages: pages || [],
    teamSpaces: teamSpaces || [],
    favorites: favorites || [],
    trash: trash || [],
    isLoading: pagesLoading || teamsLoading || favoritesLoading || trashLoading,
  };
}
