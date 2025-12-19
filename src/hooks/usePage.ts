import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Page, Block } from '@/types/workspace';
import { queryKeys } from '@/lib/queryKeys';

export function usePage(pageId: string) {
  const { data: page, isLoading: pageLoading } = useQuery<Page>({
    queryKey: queryKeys.pages.detail(pageId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (error) throw error;
      return data as unknown as Page;
    },
    enabled: !!pageId,
  });

  const { data: blocks, isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: queryKeys.blocks.all(pageId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('order', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as Block[];
    },
    enabled: !!pageId,
    placeholderData: (previousData) => previousData,
  });

  return {
    page,
    blocks: blocks || [],
    isLoading: pageLoading || blocksLoading,
  };
}
