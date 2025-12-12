import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Page } from '@/types/workspace';

export interface DatabaseProperty {
  id: string;
  name: string;
  type: string;
  options?: any;
}

export interface DatabaseRow extends Page {
  properties: Record<string, any>; // Keyed by property name or id
}

export function useDatabase(pageId: string) {
  // 1. Get the database ID from the page ID
  const { data: database } = useQuery({
    queryKey: ['database_meta', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('databases')
        .select('*')
        .eq('page_id', pageId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // Ignore not found if it's just not initialized
      return data;
    },
    enabled: !!pageId,
  });

  // 2. Get properties
  const { data: properties } = useQuery({
    queryKey: ['database_properties', database?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('database_properties')
        .select('*')
        .eq('database_id', database.id)
        .order('order');
      
      if (error) throw error;
      return data as DatabaseProperty[];
    },
    enabled: !!database?.id,
  });

  // 3. Get rows (pages)
  const { data: rows, isLoading } = useQuery({
    queryKey: ['database_rows', database?.id],
    queryFn: async () => {
      const { data: pages, error } = await supabase
        .from('pages')
        .select('*')
        .eq('parent_database_id', database.id);
      
      if (error) throw error;

      // For each page, fetch its property values
      // This is N+1 but okay for MVP. Ideally use a join or RPC.
      const pagesWithProps = await Promise.all(pages.map(async (page) => {
        const { data: props } = await supabase
          .from('page_property_values')
          .select('*, database_properties(name)')
          .eq('page_id', page.id);
        
        const propMap: Record<string, any> = {};
        props?.forEach((p: any) => {
          if (p.database_properties?.name) {
            propMap[p.database_properties.name] = p.value;
          }
        });

        return { ...page, properties: propMap } as DatabaseRow;
      }));

      return pagesWithProps;
    },
    enabled: !!database?.id,
  });

  return {
    database,
    properties: properties || [],
    rows: rows || [],
    isLoading,
  };
}
