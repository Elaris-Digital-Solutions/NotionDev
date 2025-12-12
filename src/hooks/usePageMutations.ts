import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Block, Page } from '@/types/workspace';

export function usePageMutations(pageId: string) {
  const queryClient = useQueryClient();

  const updatePage = useMutation({
    mutationFn: async (updates: Partial<Page>) => {
      const { data, error } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedPage) => {
      queryClient.setQueryData(['page', pageId], updatedPage);
      // Also invalidate workspace to update sidebar titles if needed
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    },
  });

  const updateBlock = useMutation({
    mutationFn: async ({ blockId, updates }: { blockId: string; updates: Partial<Block> }) => {
      // Separate properties that go into the 'properties' JSONB column vs top-level columns
      // For now, we assume 'updates' matches the DB schema or we handle it here.
      // The Block interface has 'content', 'type', 'properties' (JSONB).
      
      const { data, error } = await supabase
        .from('blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedBlock) => {
      queryClient.setQueryData(['blocks', pageId], (old: Block[] | undefined) => {
        if (!old) return [updatedBlock];
        return old.map((b) => (b.id === updatedBlock.id ? updatedBlock : b));
      });
    },
  });

  const createBlock = useMutation({
    mutationFn: async (block: Partial<Block>) => {
      const { data, error } = await supabase
        .from('blocks')
        .insert([{ ...block, page_id: pageId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newBlock) => {
      queryClient.setQueryData(['blocks', pageId], (old: Block[] | undefined) => {
        if (!old) return [newBlock];
        return [...old, newBlock];
      });
    },
  });

  const deleteBlock = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      return blockId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['blocks', pageId], (old: Block[] | undefined) => {
        if (!old) return [];
        return old.filter((b) => b.id !== deletedId);
      });
    },
  });

  return {
    updatePage,
    updateBlock,
    createBlock,
    deleteBlock,
  };
}
