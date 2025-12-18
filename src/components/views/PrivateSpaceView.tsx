import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TableView } from "@/components/database/TableView";
import { DatabaseProperty, DatabaseRow } from "@/hooks/useDatabase";
import { User, Lock } from "lucide-react";
import { useEnsureSystemDatabase } from "@/hooks/useEnsureSystemDatabase";
import { useAuth } from '@/components/providers/AuthProvider';

export function PrivateSpaceView() {
    const { user } = useAuth();

    // 2. Ensure System Database for PRIVATE space
    const { databaseId, properties, isLoading: propsLoading } = useEnsureSystemDatabase(undefined, true);

    // 3. Fetch Pages like they are Database Rows
    const { data: rows = [], isLoading: rowsLoading } = useQuery({
        queryKey: ['privateSpaceRules', user?.id, databaseId],
        queryFn: async () => {
            if (!user) return [];
            // Filter out the system page itself
            const { data: pages, error } = await supabase
                .from('pages')
                .select('*')
                .eq('owner_id', user.id)
                .is('team_space_id', null)
                .is('parent_id', null)
                .neq('type', 'template')
                .neq('title', '_System_Properties_DO_NOT_DELETE');

            if (error) throw error;

            // Fetch properties for these pages
            const pagesWithProps = await Promise.all(pages.map(async (page) => {
                const { data: props } = await supabase
                    .from('page_property_values')
                    .select('*, database_properties(name)')
                    // @ts-ignore
                    .eq('page_id', page.id);

                const propMap: Record<string, any> = {};
                props?.forEach((p: any) => {
                    if (p.database_properties?.name) {
                        propMap[p.database_properties.name] = p.value;
                    }
                });

                // @ts-ignore
                return { ...page, properties: propMap } as DatabaseRow;
            }));

            return pagesWithProps;
        },
        enabled: !!user && !!databaseId
    });

    if (propsLoading) return <div className="p-8">Loading private space...</div>;

    return (
        <div className="flex-1 overflow-hidden flex flex-col animate-fade-up">
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl"><Lock className="w-8 h-8 text-primary" /></span>
                    <h1 className="text-4xl font-bold text-foreground">My Private Pages</h1>
                </div>
                <p className="text-muted-foreground mb-4">
                    Managing {rows.length} personal pages.
                </p>
            </div>

            {/* Private Space doesn't have "Team Members", pass empty? Or pass ONLY self? */}
            <TableView
                rows={rows}
                properties={properties}
                pageId={'private'}
                databaseId={databaseId}
                members={user ? [{ id: user.id, full_name: user.user_metadata?.full_name || 'Me', email: user.email }] : []}
            />
        </div>
    );
}
