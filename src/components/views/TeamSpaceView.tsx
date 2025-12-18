import { useParams } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TableView } from "@/components/database/TableView";
import { DatabaseProperty, DatabaseRow } from "@/hooks/useDatabase";
import { Users } from "lucide-react";

export function TeamSpaceView() {
    const { teamSpaceId } = useParams();

    // 1. Fetch Team Space Details
    const { data: teamSpace, isLoading: spaceLoading } = useQuery({
        queryKey: ['teamSpace', teamSpaceId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('team_spaces')
                .select('*')
                .eq('id', teamSpaceId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!teamSpaceId
    });

    // 2. Fetch Pages like they are Database Rows
    // We mock a "Database Property" schema for the Team Space view to enforce the "Table" look
    const properties: DatabaseProperty[] = [
        { id: 'status', name: 'Status', type: 'status' },
        { id: 'priority', name: 'Priority', type: 'priority' },
        { id: 'dueDate', name: 'Due Date', type: 'date' },
        { id: 'responsible', name: 'Responsible', type: 'person' },
    ];

    const { data: rows = [], isLoading: rowsLoading } = useQuery({
        queryKey: ['teamSpaceRules', teamSpaceId],
        queryFn: async () => {
            const { data: pages, error } = await supabase
                .from('pages')
                .select('*')
                .eq('team_space_id', teamSpaceId)
                .is('parent_id', null); // Only roots

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
        enabled: !!teamSpaceId
    });

    if (spaceLoading) return <div className="p-8">Loading space...</div>;
    if (!teamSpace) return <div className="p-8">Team Space not found</div>;

    return (
        <div className="flex-1 overflow-hidden flex flex-col animate-fade-up">
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    {/* @ts-ignore */}
                    <span className="text-4xl">{teamSpace.icon || <Users className="w-8 h-8" />}</span>
                    {/* @ts-ignore */}
                    <h1 className="text-4xl font-bold text-foreground">{teamSpace.name}</h1>
                </div>
                <p className="text-muted-foreground mb-4">
                    Managing {rows.length} pages in this workspace.
                </p>
            </div>

            <TableView
                rows={rows}
                properties={properties}
                pageId={teamSpaceId || ''}
            // We don't pass databaseId because this is a virtual view, 
            // editing columns might be restricted or we need a real DB for that.
            // For now, rows are editable.
            />
        </div>
    );
}
