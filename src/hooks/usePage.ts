import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Page, Block } from '@/types/workspace';
import { queryKeys } from '@/lib/queryKeys';
import { useEffect } from 'react';

export function usePage(pageId: string) {
  const queryClient = useQueryClient();

  // Real-time Subscription
  useEffect(() => {
    if (!pageId) return;

    const channel = supabase.channel(`page-${pageId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocks', filter: `page_id=eq.${pageId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all(pageId) });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pages', filter: `id=eq.${pageId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.pages.detail(pageId) });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_property_values', filter: `page_id=eq.${pageId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pagePropertyValues', pageId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, queryClient]);

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
