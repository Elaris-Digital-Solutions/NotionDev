import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Block } from '@/types/workspace';
import { BlockWrapper } from '@/components/editor/BlockWrapper';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BlockEditorProps {
  blocks: Block[];
  onAddBlock: (type: string, afterBlockId: string | null) => void;
  onUpdateBlock: (id: string, content: any, plainText: string, version: number) => void;
  onDeleteBlock: (id: string) => void;
  readOnly?: boolean;
}

export function BlockEditor({ blocks, onAddBlock, onUpdateBlock, onDeleteBlock, readOnly = false }: BlockEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimate height in px
    overscan: 5,
  });

  if (blocks.length === 0 && !readOnly) {
    return (
      <div 
        className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onAddBlock('text', null)}
      >
        Click to add your first block
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={parentRef} 
        className="flex-1 overflow-y-auto w-full relative min-h-[500px]" // Ensure height for virtualization
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const block = blocks[virtualRow.index];
            return (
              <div
                key={block.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                ref={rowVirtualizer.measureElement} // Dynamic height measurement
              >
                <div className="px-1">
                  <BlockWrapper 
                     block={block} 
                     onUpdate={onUpdateBlock}
                     onDelete={onDeleteBlock}
                     readOnly={readOnly}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bottom padding or 'click to add' area if list is short */}
        {!readOnly && (
            <div 
              className="mt-4 p-2 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer flex items-center text-sm"
              onClick={() => onAddBlock('text', blocks.length > 0 ? blocks[blocks.length - 1].id : null)}
              style={{
                 transform: `translateY(${rowVirtualizer.getTotalSize()}px)` // Push it below content
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Click to append block
            </div>
        )}
      </div>
    </div>
  );
}
