import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Block, Page } from '@/types/workspace';
import { queryKeys } from '@/lib/queryKeys';

export function usePageMutations(pageId: string) {
  const queryClient = useQueryClient();

  const updatePage = useMutation({
    mutationFn: async (updates: Partial<Page>) => {
      const { blocks, ...pageUpdates } = updates;
      const { data, error } = await (supabase.from('pages') as any)
        .update(pageUpdates)
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedPage) => {
      queryClient.setQueryData(queryKeys.pages.detail(pageId), updatedPage);
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace() });
    },
  });

  const updateBlock = useMutation({
    onMutate: async (newBlockVars) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blocks.all(pageId) });
      const previousBlocks = queryClient.getQueryData<Block[]>(queryKeys.blocks.all(pageId));

      queryClient.setQueryData(queryKeys.blocks.all(pageId), (old: Block[] | undefined) => {
        if (!old) return [];
        return old.map((b) => {
          if (b.id === newBlockVars.blockId) {
            return {
              ...b,
              ...newBlockVars.updates,
              ...(newBlockVars.content !== undefined ? { content: newBlockVars.content } : {}),
              ...(newBlockVars.version !== undefined ? { version: (b.version || 0) + 1 } : {})
            };
          }
          return b;
        });
      });

      return { previousBlocks };
    },
    mutationFn: async ({ blockId, content, plainText, version, updates }: { blockId: string; content?: any; plainText?: string; version?: number; updates?: Partial<Block> }) => {
      let query = (supabase.from('blocks') as any).update({
        ...updates,
        ...(content !== undefined ? { content } : {}),
        ...(plainText !== undefined ? { plain_text: plainText } : {}),
        ...(version !== undefined ? { version: version + 1 } : {})
      })
        .eq('id', blockId);

      if (version !== undefined) {
        query = query.eq('version', version);
      }

      const { data, error } = await query.select().single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error("Conflict: Block has been modified by another user. Reloading...");
        }
        throw error;
      }
      return data;
    },
    onError: (err, newBlock, context) => {
      queryClient.setQueryData(queryKeys.blocks.all(pageId), context?.previousBlocks);
      if (err.message.includes('Conflict')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all(pageId) });
      }
    }
  });

  const createBlock = useMutation({
    mutationFn: async (block: Partial<Block>) => {
      const { children, ...blockData } = block;
      const { data, error } = await (supabase.from('blocks') as any)
        .insert([{ ...blockData, page_id: pageId } as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newBlock) => {
      queryClient.setQueryData(queryKeys.blocks.all(pageId), (old: Block[] | undefined) => {
        if (!old) return [newBlock];
        return [...old, newBlock];
      });
    },
  });

  const deleteBlock = useMutation({
    onMutate: async (blockId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blocks.all(pageId) });
      const previousBlocks = queryClient.getQueryData(queryKeys.blocks.all(pageId));

      queryClient.setQueryData(queryKeys.blocks.all(pageId), (old: Block[] | undefined) => {
        if (!old) return [];
        return old.filter((b) => b.id !== blockId);
      });

      return { previousBlocks };
    },
    mutationFn: async (blockId: string) => {
      const { error } = await (supabase.from('blocks') as any).delete().eq('id', blockId);
      if (error) throw error;
    },
    onError: (err, blockId, context) => {
      queryClient.setQueryData(queryKeys.blocks.all(pageId), context?.previousBlocks);
    }
  });

  const createChildPage = useMutation({
    mutationFn: async (title: string = 'Untitled') => {
      const { data, error } = await (supabase.from('pages') as any)
        .insert([{ title, parent_id: pageId, type: 'page', icon: '📄' }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebar.children(pageId) });
      // Invalidate open nodes in sidebar? Ideally we updated local cache if we had parent node context
    },
  });

  const setPageProperty = useMutation({
    mutationFn: async ({ pageId: targetPageId, propertyId, value }: { pageId: string; propertyId: string; value: any }) => {
      const { data, error } = await (supabase.from('page_property_values') as any)
        .upsert({ page_id: targetPageId, property_id: propertyId, value }, { onConflict: 'page_id, property_id' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.database.rows(pageId) }); // Approximate
      queryClient.invalidateQueries({ queryKey: queryKeys.all }); // Fallback
    },
  });

  const moveBlock = useMutation({
    onMutate: async ({ blockId, direction }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blocks.all(pageId) });
      const previousBlocks = queryClient.getQueryData<Block[]>(queryKeys.blocks.all(pageId));

      if (previousBlocks) {
        const sorted = [...previousBlocks].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(b => b.id === blockId);
        if (index !== -1) {
          const targetIndex = direction === 'up' ? index - 1 : index + 1;
          if (targetIndex >= 0 && targetIndex < sorted.length) {
            const newBlocks = [...sorted];
            const tempOrder = newBlocks[index].order;
            newBlocks[index] = { ...newBlocks[index], order: newBlocks[targetIndex].order };
            newBlocks[targetIndex] = { ...newBlocks[targetIndex], order: tempOrder };
            newBlocks.sort((a, b) => a.order - b.order);
            queryClient.setQueryData(queryKeys.blocks.all(pageId), newBlocks);
          }
        }
      }
      return { previousBlocks };
    },
    mutationFn: async ({ blockId, direction }: { blockId: string; direction: 'up' | 'down' }) => {
      const { data: blocks } = await (supabase.from('blocks') as any)
        .select('*')
        .eq('page_id', pageId)
        .order('order', { ascending: true });

      if (!blocks) throw new Error("Could not fetch blocks");

      const index = blocks.findIndex(b => b.id === blockId);
      if (index === -1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= blocks.length) return;

      const currentBlock = blocks[index];
      const targetBlock = blocks[targetIndex];

      const { error: error1 } = await (supabase.from('blocks') as any).update({ order: targetBlock.order }).eq('id', currentBlock.id);
      const { error: error2 } = await (supabase.from('blocks') as any).update({ order: currentBlock.order }).eq('id', targetBlock.id);
      if (error1 || error2) throw error1 || error2;
    },
    onError: (err, newBlock, context) => {
      queryClient.setQueryData(queryKeys.blocks.all(pageId), context?.previousBlocks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all(pageId) });
    }
  });

  const reorderBlock = useMutation({
    onMutate: async ({ activeId, overId }: { activeId: string; overId: string }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.blocks.all(pageId) });
      const previousBlocks = queryClient.getQueryData<Block[]>(queryKeys.blocks.all(pageId));

      if (previousBlocks) {
        const oldIndex = previousBlocks.findIndex((b) => b.id === activeId);
        const newIndex = previousBlocks.findIndex((b) => b.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newBlocks = [...previousBlocks];
          const [movedBlock] = newBlocks.splice(oldIndex, 1);
          newBlocks.splice(newIndex, 0, movedBlock);

          // Optimistically update orders
          const reordered = newBlocks.map((b, idx) => ({ ...b, order: idx }));
          queryClient.setQueryData(queryKeys.blocks.all(pageId), reordered);
        }
      }
      return { previousBlocks };
    },
    mutationFn: async ({ activeId, overId }: { activeId: string; overId: string }) => {
      // We need the current state to calculate positions
      const { data: blocks } = await (supabase.from('blocks') as any)
        .select('id, order')
        .eq('page_id', pageId)
        .order('order', { ascending: true });

      if (!blocks) throw new Error("Failed to fetch blocks for reordering");

      const oldIndex = blocks.findIndex((b) => b.id === activeId);
      const newIndex = blocks.findIndex((b) => b.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newBlocks = [...blocks];
      const [movedBlock] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, movedBlock);

      // Update all affected blocks
      // Optimization: only update ranges between oldIndex and newIndex
      const updates = newBlocks.map((b, index) => ({
        id: b.id,
        order: index,
        // We only strictly need to update if order changed, but batching logic is simpler here
      }));

      // Batch update? Supabase doesn't have native bulk update for different values easily without rpc.
      // We will iterate for now, or use Upsert if we had all fields. 
      // For speed in this demo, strict order update:
      const updatesToRun = updates.filter((u, idx) => u.order !== blocks.find(b => b.id === u.id)?.order);

      await Promise.all(updatesToRun.map(u =>
        (supabase.from('blocks') as any).update({ order: u.order }).eq('id', u.id)
      ));
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(queryKeys.blocks.all(pageId), context?.previousBlocks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all(pageId) });
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
    reorderBlock,
  };
}
