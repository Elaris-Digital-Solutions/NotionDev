import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatabaseView } from "@/components/views/DatabaseView";
import { DatabaseProperty, DatabaseRow } from "@/hooks/useDatabase";
import { User, Lock } from "lucide-react";
import { useEnsureSystemDatabase } from "@/hooks/useEnsureSystemDatabase";
import { useAuth } from '@/components/providers/AuthProvider';

export function PrivateSpaceView() {
    const { user } = useAuth();

    // 2. Ensure System Database for PRIVATE space
    const { pageId: databasePageId, databaseId, isLoading: propsLoading } = useEnsureSystemDatabase(undefined, true);

    // 3. Fetch Pages logic moved to DatabaseView via useDatabase

    if (propsLoading) return <div className="p-8">Loading private space...</div>;

    return (
        <div className="flex-1 overflow-hidden flex flex-col animate-fade-up">
            <div className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-4xl"><Lock className="w-8 h-8 text-primary" /></span>
                    <h1 className="text-4xl font-bold text-foreground">My Private Pages</h1>
                </div>
                <p className="text-muted-foreground mb-4">
                    Managing personal pages.
                </p>
            </div>

            {/* Private Space doesn't have "Team Members", pass empty? Or pass ONLY self? */}
            {/* Use DatabaseView to get standard Notion headers */}
            {
                databasePageId && (
                    <DatabaseView
                        pageId={databasePageId}
                        title="My Private Pages"
                        icon="🔒"
                    />
                )
            }
        </div >
    );
}
