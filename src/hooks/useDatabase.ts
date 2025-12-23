import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Page } from '@/types/workspace';

export interface DatabaseProperty {
  id: string;
  name: string;
  type: string;
  options?: any;
  config?: any;
  position?: number;
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
    queryKey: ['database_properties', (database as any)?.id],
    queryFn: async () => {
      const db = database as any;
      if (!db?.id) return [];
      const { data, error } = await supabase
        .from('database_properties')
        .select('*')
        .eq('database_id', db.id)
        .order('order');

      if (error) throw error;
      // Filter out system properties (starting with _)
      return (data as DatabaseProperty[]).filter(p => !p.name.startsWith('_') && p.name !== '_System_Properties_DO_NOT_DELETE');
    },
    enabled: !!(database as any)?.id,
  });

  // 3. Get rows (pages)
  // Need to fetch the Page details effectively to know if we are in a "System DB" context
  const { data: pageDetails } = useQuery({
    queryKey: ['page_details', pageId],
    queryFn: async () => {
      const { data, error } = await supabase.from('pages').select('*').eq('id', pageId).single();
      if (error) throw error;
      return data as Page; // Explicit cast to fix TS 'never' inference
    },
    enabled: !!pageId
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ['database_rows', (database as any)?.id, pageDetails?.id],
    queryFn: async () => {
      const db = database as any;
      if (!db?.id) return [];

      let query = supabase.from('pages').select('*');

      const isSystemDB = pageDetails?.title === '_System_Properties_DO_NOT_DELETE';

      if (isSystemDB && pageDetails) {
        if (pageDetails.team_space_id) {
          query = query.or(`and(team_space_id.eq.${pageDetails.team_space_id},parent_id.is.null),parent_id.eq.${pageDetails.id},parent_database_id.eq.${db.id}`);
        } else {
          query = query.or(`and(owner_id.eq.${pageDetails.owner_id},team_space_id.is.null,parent_id.is.null),parent_id.eq.${pageDetails.id},parent_database_id.eq.${db.id}`);
        }
        query = query.neq('id', pageDetails.id);
      } else {
        query = query.eq('parent_database_id', db.id);
      }

      const { data: pages, error } = await (query as any).neq('title', '_System_Properties_DO_NOT_DELETE');

      if (error) throw error;
      if (!pages || pages.length === 0) return [];

      // Optimize: Batch fetch properties for all pages
      const pageIds = pages.map((p: any) => p.id);
      const { data: allProps } = await (supabase.from('page_property_values') as any)
        .select('*, database_properties(name)')
        .in('page_id', pageIds);

      // Map properties to pages
      const pagesWithProps = pages.map((page: any) => {
        const pageProps = allProps?.filter(p => p.page_id === page.id) || [];
        const propMap: Record<string, any> = {};

        pageProps.forEach((p: any) => {
          if (p.database_properties?.name) {
            propMap[p.database_properties.name] = p.value;
          }
        });

        return { ...page, properties: propMap } as DatabaseRow;
      });

      return pagesWithProps;
    },
    enabled: !!(database as any)?.id && (!!pageDetails || !!pageId),
  });

  // 4. Auto-create default columns logic removed to prevent race conditions.
  const qc = useQueryClient();

  // 4. Removed auto-create default columns logic to prevent race conditions with useEnsureSystemDatabase.
  // The System Database creation logic in useEnsureSystemDatabase handles this.


  return {
    database,
    properties: properties || [],
    rows: rows || [],
    isLoading,
  };
}
