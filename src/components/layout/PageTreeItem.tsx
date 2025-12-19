import { useState } from 'react';
import { ChevronRight, FileText, MoreHorizontal, Plus, Trash, CheckSquare, Users, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChildPages } from '@/hooks/useChildPages';
import { Page } from '@/types/workspace';
import { useWorkspaceMutations } from '@/hooks/useWorkspaceMutations';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface PageTreeItemProps {
    page: Page;
    currentPageId: string;
    onPageChange: (id: string) => void;
    level?: number;
}

export function PageTreeItem({ page, currentPageId, onPageChange, level = 0 }: PageTreeItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Lazy load children only when open
    // We use enabled: isOpen to prevent fetching until expanded
    const { data: children = [], isLoading } = useChildPages(page.id, isOpen);

    const { createPage, permanentlyDeletePage } = useWorkspaceMutations(); // Reusing existing mutations hook if available or we might need to verify usage

    const handleCreateChild = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(true);
        await createPage.mutateAsync({ parentId: page.id }); // Verify mutate signature
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Delete this page?")) {
            permanentlyDeletePage.mutate(page.id);
        }
    };

    const hasChildren = (children && children.length > 0) || isLoading; // Show expander if we don't know yet? 
    // actually for lazy load we might not know if it has children until we fetch.
    // Notion shows 'No pages inside' after expanding if empty. 
    // Better UX: Always show arrow if we assume blocks/children could exist, or check 'has_children' count if DB supports it.
    // For MVP we can just show arrow.

    const Icon = getPageIcon(page.icon);

    return (
        <div className="select-none">
            <div
                className={cn(
                    "group flex items-center gap-1 py-1 pr-2 rounded-sm hover:bg-sidebar-accent/50 cursor-pointer transition-colors min-h-[28px]",
                    currentPageId === page.id && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                style={{ paddingLeft: `${(level * 12) + 8}px` }}
                onClick={() => onPageChange(page.id)}
            >
                <div
                    className="p-0.5 rounded hover:bg-muted/20 text-muted-foreground transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    <ChevronRight
                        className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")}
                    />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                    <span className="shrink-0 text-sm">
                        {page.icon && !['📄', '✅', '👥', '✏️'].includes(page.icon) ? page.icon : <Icon className="w-4 h-4 text-muted-foreground" />}
                    </span>
                    <span className="truncate text-sm opacity-90">{page.title}</span>
                </div>

                {/* Quick Actions (Hover) */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleDelete}
                        className="p-1 hover:text-destructive transition-colors"
                    >
                        <Trash className="w-3 h-3" />
                    </button>
                    <button
                        onClick={handleCreateChild}
                        className="p-1 hover:text-primary transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Children Recursive List */}
            <Collapsible open={isOpen}>
                <CollapsibleContent>
                    {isLoading && (
                        <div className="pl-6 py-1">
                            <Skeleton className="h-4 w-24" />
                        </div>
                    )}

                    {!isLoading && children.length === 0 && isOpen && (
                        <div
                            className="text-xs text-muted-foreground py-1 select-none"
                            style={{ paddingLeft: `${((level + 1) * 12) + 24}px` }}
                        >
                            No pages inside
                        </div>
                    )}

                    {children.map(child => (
                        <PageTreeItem
                            key={child.id}
                            page={child}
                            currentPageId={currentPageId}
                            onPageChange={onPageChange}
                            level={level + 1}
                        />
                    ))}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

function getPageIcon(emoji?: string): React.ComponentType<{ className?: string }> {
    switch (emoji) {
        case '✅': return CheckSquare;
        case '👥': return Users;
        case '✏️': return PenLine;
        default: return FileText;
    }
}
