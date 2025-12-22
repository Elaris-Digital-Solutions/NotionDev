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
    queryKey: ['database_properties', database?.id],
    queryFn: async () => {
      if (!database?.id) return [];
      const { data, error } = await supabase
        .from('database_properties')
        .select('*')
        .eq('database_id', database.id)
        .order('order');

      if (error) throw error;
      // Filter out system properties (starting with _)
      return (data as DatabaseProperty[]).filter(p => !p.name.startsWith('_') && p.name !== '_System_Properties_DO_NOT_DELETE');
    },
    enabled: !!database?.id,
  });

  // 3. Get rows (pages)
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
    queryKey: ['database_rows', database?.id, pageDetails?.id],
    queryFn: async () => {
      if (!database?.id) return [];

      let query = supabase.from('pages').select('*');

      const isSystemDB = pageDetails?.title === '_System_Properties_DO_NOT_DELETE';

      if (isSystemDB && pageDetails) {
        // Special "Shadow Database" Logic
        if (pageDetails.team_space_id) {
          // Team Space: Fetch Root items OR Children of System DB OR Linked to System DB
          query = query.or(`and(team_space_id.eq.${pageDetails.team_space_id},parent_id.is.null),parent_id.eq.${pageDetails.id},parent_database_id.eq.${database.id}`);
        } else {
          // Private Space: Fetch Root private items OR Children of System DB OR Linked
          query = query.or(`and(owner_id.eq.${pageDetails.owner_id},team_space_id.is.null,parent_id.is.null),parent_id.eq.${pageDetails.id},parent_database_id.eq.${database.id}`);
        }
        // Always exclude self (System DB Page)
        query = query.neq('id', pageDetails.id);
      } else {
        // Standard Database Logic
        query = query.eq('parent_database_id', database.id);
      }

      const { data: pages, error } = await query.neq('title', '_System_Properties_DO_NOT_DELETE');

      if (error) throw error;

      // For each page, fetch its property values
      // This is N+1 but okay for MVP. Ideally use a join or RPC.
      const pagesWithProps = await Promise.all((pages || []).map(async (page: any) => {
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
    enabled: !!database?.id && (!!pageDetails || !!pageId),
  });

  // 4. Auto-create default columns if missing
  const queryClient = import('@tanstack/react-query').then(m => m.useQueryClient());
  // We need the queryClient instance, but we can't await import in body.
  // Actually, let's just use the supabase client directly for the check, no need for mutations hook overhead here for simplicity.

  // Actually, we can just use the queryClient from context if we move this logical check to a component or just fire-and-forget here.
  // Better: DO NOT use useEffect for side effects that change DB if possible, but here it's necessary for "migration".
  // A cleaner simple way:

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
