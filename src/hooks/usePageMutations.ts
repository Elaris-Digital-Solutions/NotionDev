import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Block, Page } from '@/types/workspace';

export function usePageMutations(pageId: string) {
  const queryClient = useQueryClient();

  const updatePage = useMutation({
    mutationFn: async (updates: Partial<Page>) => {
      // Remove fields that are not in the database table
      const { blocks, ...pageUpdates } = updates;
      
      const { data, error } = await supabase
        .from('pages')
        .update(pageUpdates)
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
      const { children, ...blockUpdates } = updates;
      
      const { data, error } = await supabase
        .from('blocks')
        .update(blockUpdates)
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
      const { children, ...blockData } = block;
      const { data, error } = await supabase
        .from('blocks')
        .insert([{ ...blockData, page_id: pageId } as any]) // Cast to any to avoid strict type checking on insert
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

  const createChildPage = useMutation({
    mutationFn: async (title: string = 'Untitled') => {
      const { data, error } = await supabase
        .from('pages')
        .insert([
          { 
            title, 
            parent_id: pageId,
            type: 'page',
            icon: '📄'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database', pageId] });
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    },
  });

  const setPageProperty = useMutation({
    mutationFn: async ({ pageId: targetPageId, propertyId, value }: { pageId: string; propertyId: string; value: any }) => {
      const { data, error } = await supabase
        .from('page_property_values')
        .upsert(
          { page_id: targetPageId, property_id: propertyId, value },
          { onConflict: 'page_id, property_id' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database_rows'] });
    },
  });

  const moveBlock = useMutation({
    mutationFn: async ({ blockId, direction }: { blockId: string; direction: 'up' | 'down' }) => {
      // Get current blocks
      const blocks = queryClient.getQueryData<Block[]>(['blocks', pageId]) || [];
      // Sort blocks by order to ensure correct index
      const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
      
      const index = sortedBlocks.findIndex(b => b.id === blockId);
      if (index === -1) return;
      
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sortedBlocks.length) return;
      
      const currentBlock = sortedBlocks[index];
      const targetBlock = sortedBlocks[targetIndex];
      
      // Swap orders
      const { error: error1 } = await supabase
        .from('blocks')
        .update({ order: targetBlock.order })
        .eq('id', currentBlock.id);
        
      const { error: error2 } = await supabase
        .from('blocks')
        .update({ order: currentBlock.order })
        .eq('id', targetBlock.id);
        
      if (error1 || error2) throw error1 || error2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks', pageId] });
    }
  });

  return {
    updatePage,
    updateBlock,
    createBlock,
    deleteBlock,
    createChildPage,
    setPageProperty,
    moveBlock,
  };
}
