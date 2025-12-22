import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseColumn } from '@/types/workspace';
import { Database } from '@/types/supabase';

type DBPropInsert = Database['public']['Tables']['database_properties']['Insert'];
type DBPropUpdate = Database['public']['Tables']['database_properties']['Update'];
type PagePropValInsert = Database['public']['Tables']['page_property_values']['Insert'];

export function useDatabaseMutations(databaseId?: string) {
  const queryClient = useQueryClient();

  const addProperty = useMutation({
    mutationFn: async (column: Omit<DatabaseColumn, 'id'>) => {
      if (!databaseId) throw new Error("No database ID");
      const { error } = await (supabase
        .from('database_properties') as any)
        .insert({
          name: column.name,
          type: column.type,
          config: column.config || { options: [] }, // Default config
          position: column.position // Use passed position
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database_properties', databaseId] });
    }
  });

  const updateProperty = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<DatabaseColumn> }) => {
      const { error } = await (supabase
        .from('database_properties') as any)
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database_properties', databaseId] });
    }
  });

  const deleteProperty = useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await (supabase
        .from('database_properties') as any)
        .delete()
        .eq('id', propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database_properties', databaseId] });
    }
  });

  const updatePropertyValue = useMutation({
    mutationFn: async ({ pageId, propertyId, value }: { pageId: string; propertyId: string; value: any }) => {
      const { error } = await (supabase
        .from('page_property_values') as any)
        .upsert({ page_id: pageId, property_id: propertyId, value }, { onConflict: 'page_id, property_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['database_rows', databaseId] });
    }
  });

  return { addProperty, updateProperty, deleteProperty, updatePropertyValue };
}
