import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseProperty } from '@/hooks/useDatabase';
import { useEffect } from 'react';

const SYSTEM_DB_NAME = '_System_Properties_DO_NOT_DELETE';

export function useEnsureSystemDatabase(teamSpaceId?: string, isPrivate: boolean = false) {
    const queryClient = useQueryClient();

    const { data: systemDatabase, isLoading } = useQuery({
        queryKey: ['systemDatabase', teamSpaceId, isPrivate],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            // 1. Try to find existing System Database Page
            let query = supabase
                .from('pages')
                .select(`
            id, 
            databases!inner (
                id
            )
        `)
                .eq('title', SYSTEM_DB_NAME)
                .eq('type', 'database')
                .eq('owner_id', user.id);

            if (teamSpaceId) {
                query = query.eq('team_space_id', teamSpaceId);
            } else if (isPrivate) {
                query = query.is('team_space_id', null);
            } else {
                return null;
            }

            const { data: existing, error } = await query.maybeSingle();

            if (existing) {
                // @ts-ignore
                return { pageId: existing.id, databaseId: existing.databases[0]?.id };
            }

            // 2. Create if null
            // Create Page
            const pageData = {
                title: SYSTEM_DB_NAME,
                owner_id: user.id,
                team_space_id: teamSpaceId || null,
                type: 'database',
                icon: '⚙️'
            };

            const { data: newPage, error: createError } = await supabase
                .from('pages')
                .insert([pageData])
                .select()
                .single();

            if (createError) throw createError;

            // Create Database Record
            const { data: newDb, error: dbError } = await supabase
                .from('databases')
                .insert([{ page_id: newPage.id }])
                .select()
                .single();

            if (dbError) throw dbError;

            return { pageId: newPage.id, databaseId: newDb.id };
        },
        enabled: !!(teamSpaceId || isPrivate)
    });

    // 3. Ensure Properties Exist
    const { data: properties = [] } = useQuery({
        queryKey: ['systemProperties', systemDatabase?.databaseId],
        queryFn: async () => {
            if (!systemDatabase?.databaseId) return [];

            const { data, error } = await supabase
                .from('database_properties')
                .select('*')
                .eq('database_id', systemDatabase.databaseId)
                .order('order');

            if (error) throw error;

            // Check for defaults
            const defaults = [
                { name: 'Status', type: 'status' },
                { name: 'Priority', type: 'priority' },
                { name: 'Due Date', type: 'date' },
                { name: 'Responsible', type: 'person' }
            ];

            const missing = defaults.filter(d => !data.find(p => p.name === d.name));

            if (missing.length > 0) {
                for (const m of missing) {
                    await supabase.from('database_properties').insert({
                        database_id: systemDatabase.databaseId,
                        name: m.name,
                        type: m.type,
                        order: 99
                    });
                }
                // Refetch
                const { data: refreshed } = await supabase
                    .from('database_properties')
                    .select('*')
                    .eq('database_id', systemDatabase.databaseId);
                return refreshed as DatabaseProperty[];
            }

            // Filter out system properties
            return (data as DatabaseProperty[]).filter(p => !p.name.startsWith('_') && p.name !== '_System_Properties_DO_NOT_DELETE');
        },
        enabled: !!systemDatabase?.databaseId
    });

    return {
        pageId: systemDatabase?.pageId,
        databaseId: systemDatabase?.databaseId,
        properties,
        isLoading
    };
}
