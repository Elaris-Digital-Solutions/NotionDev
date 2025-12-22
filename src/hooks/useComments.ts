import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Comment {
    id: string;
    page_id: string;
    block_id?: string;
    user_id: string;
    content: string;
    created_at: string;
    resolved_at?: string;
    user?: {
        email: string;
        // profiles link usually? For simplicity we might just get email if we look up auth.users or profiles
        full_name?: string;
    }
}

export function useComments(pageId: string) {
    const queryClient = useQueryClient();

    const { data: comments, isLoading } = useQuery({
        queryKey: ['comments', pageId],
        queryFn: async () => {
            const { data, error } = await (supabase.from('comments') as any)
                .select('*')
                // If profiles table exists and user_id is FK to it (or just same ID), we join profiles.
                // Our previous setup had 'profiles'.
                .eq('page_id', pageId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Profiles join fix:
            // If user_id references auth.users, and we have public.profiles with same ID:
            // We should probably select from 'comments' and manual join or standard join if relations exist.
            // Let's assume standard join works if relational constraints are set, effectively 'profiles'.
            // If RLS on profiles allows reading.

            return data as any[];
        },
        enabled: !!pageId,
    });

    const createComment = useMutation({
        mutationFn: async ({ content, blockId }: { content: string, blockId?: string }) => {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("Not logged in");

            const { data, error } = await (supabase.from('comments') as any)
                .insert([{
                    page_id: pageId,
                    block_id: blockId,
                    user_id: user.id,
                    content
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', pageId] });
        }
    });

    return {
        comments: comments || [],
        isLoading,
        createComment
    };
}
