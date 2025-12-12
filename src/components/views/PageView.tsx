import { BlockEditor } from "@/components/blocks/BlockEditor";
import { DatabaseView } from "@/components/views/DatabaseView";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePage } from "@/hooks/usePage";
import { usePageMutations } from "@/hooks/usePageMutations";

interface PageViewProps {
  pageId: string;
}

export function PageView({ pageId }: PageViewProps) {
  const { page, blocks, isLoading } = usePage(pageId);
  const { updatePage, updateBlock, deleteBlock, createBlock, moveBlock } = usePageMutations(pageId);

  if (isLoading) {
    return <div className="p-8">Loading page...</div>;
  }

  if (!page) {
    return <div className="p-8">Page not found</div>;
  }

  if (page.type === 'database') {
    return <DatabaseView title={page.title} icon={page.icon || undefined} pageId={page.id} />;
  }

  return (
    <div className="flex-1 overflow-auto animate-fade-up">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-pink-100 to-blue-100 w-full group relative">
        {page.cover_image && <img src={page.cover_image} alt="Cover" className="w-full h-full object-cover" />}
        <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Change cover
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-12 pb-32 -mt-12 relative z-10">
        {/* Page Icon */}
        <div className="text-7xl mb-4 hover:bg-accent/20 w-fit rounded p-2 cursor-pointer transition-colors">
            {page.icon || '📄'}
        </div>

        {/* Page Title */}
        <div className="group mb-8">
            <h1 
              className="text-4xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50" 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => {
                const newTitle = e.currentTarget.textContent || 'Untitled';
                if (newTitle !== page.title) {
                  updatePage.mutate({ title: newTitle });
                }
              }}
            >
                {page.title}
            </h1>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Edited {new Date(page.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>Add comment</span>
                </div>
            </div>
        </div>

        {/* Blocks */}
        <div className="pb-32">
          <BlockEditor 
            blocks={blocks}
            onAddBlock={(type, afterBlockId) => {
              const afterBlock = blocks.find(b => b.id === afterBlockId);
              createBlock.mutate({ 
                type, 
                content: '', 
                order: afterBlock ? (afterBlock.order || 0) + 1 : 0 
              });
            }}
            onUpdateBlock={(id, content) => updateBlock.mutate({ blockId: id, updates: { content } })}
            onDeleteBlock={(id) => deleteBlock.mutate(id)}
            onMoveBlock={(id, direction) => moveBlock.mutate({ blockId: id, direction })}
          />
        </div>
      </div>
    </div>
  );
}
