import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Page } from '@/types/workspace';

export function useChildPages(parentId: string | null, enabled: boolean = true) {
    return useQuery({
        queryKey: ['pages', 'children', parentId],
        queryFn: async () => {
            if (!parentId) return [];
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .eq('parent_id', parentId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as Page[];
        },
        enabled: !!parentId && enabled,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}
