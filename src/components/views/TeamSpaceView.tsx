import { useParams } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseView } from "@/components/views/DatabaseView";
import { DatabaseProperty, DatabaseRow } from "@/hooks/useDatabase";
import { Users } from "lucide-react";
import { useEnsureSystemDatabase } from "@/hooks/useEnsureSystemDatabase";

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

    // 2. Ensure System Database & Get Properties
    const { pageId: databasePageId, databaseId, isLoading: propsLoading } = useEnsureSystemDatabase(teamSpaceId);

    // 3. Fetch Pages like they are Database Rows - LOGIC MOVED TO DatabaseView (via useDatabase)
    // We strictly use the system database now.

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
                    Managing pages in this workspace.
                </p>
            </div>

            {/* Use DatabaseView to get standard Notion headers (New, Filter, Sort, View Switcher) */}
            {/* We pass the System Database Page ID */}
            {databasePageId && (
                <TeamMembersLoader teamId={teamSpaceId} render={(members) => (
                    <DatabaseView
                        pageId={databasePageId}
                        title={teamSpace.name}
                        icon={teamSpace.icon || '👥'}
                        members={members}
                    />
                )} />
            )}
        </div>
    );
}

function TeamMembersLoader({ teamId, render }: { teamId?: string, render: (members: any[]) => React.ReactNode }) {
    const { data: members = [] } = useQuery({
        queryKey: ['teamMembers', teamId],
        queryFn: async () => {
            if (!teamId) return [];
            const { data, error } = await supabase
                .from('team_members')
                .select(`
                    user_id,
                    profiles:user_id (
                        id,
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('team_id', teamId);

            if (error) {
                console.error('Error fetching members:', error);
                return [];
            }
            // Simplify structure
            // @ts-ignore
            return data.map(m => m.profiles).filter(Boolean);
        },
        enabled: !!teamId
    });

    return <>{render(members)}</>;
}
