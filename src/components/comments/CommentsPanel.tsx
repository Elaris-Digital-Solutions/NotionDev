import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface CommentsPanelProps {
    pageId: string;
}

export function CommentsPanel({ pageId }: CommentsPanelProps) {
    const { comments, createComment, isLoading } = useComments(pageId);
    const [newComment, setNewComment] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = () => {
        if (!newComment.trim()) return;
        createComment.mutate({ content: newComment });
        setNewComment("");
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground relative">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments
                    {comments.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                            {comments.length}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col pt-12">
                <SheetHeader>
                    <SheetTitle>Comments</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-6 py-4">
                        {comments.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm py-8">
                                No comments yet. Be the first to start a conversation.
                            </div>
                        )}
                        {comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>{(comment.user?.email || 'U')[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{comment.user?.email || 'Unknown User'}</span>
                                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                        <Textarea
                            placeholder="Write a comment..."
                            className="min-h-[80px] resize-none"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-end mt-2">
                        <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || createComment.isPending}>
                            <Send className="w-4 h-4 mr-2" />
                            Post
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
