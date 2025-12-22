import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Block } from '@/types/workspace';
import { BlockWrapper } from '@/components/editor/BlockWrapper';
import { Plus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface BlockEditorProps {
  blocks: Block[];
  onAddBlock: (type: string, afterBlockId: string | null) => void;
  onUpdateBlock: (id: string, content: any, plainText: string, version: number) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock?: (id: string, direction: 'up' | 'down') => void; // Legacy
  onReorderBlock?: (activeId: string, overId: string) => void; // New for DnD
  readOnly?: boolean;
}

export function BlockEditor({ blocks, onAddBlock, onUpdateBlock, onDeleteBlock, onReorderBlock, readOnly = false }: BlockEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && onReorderBlock) {
      onReorderBlock(active.id as string, over?.id as string);
    }
  };

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto w-full relative min-h-[500px]"
        >
          <SortableContext
            items={blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
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
                    ref={rowVirtualizer.measureElement}
                  >
                    <div className="px-1">
                      <BlockWrapper
                        block={block}
                        onUpdate={onUpdateBlock}
                        onDelete={onDeleteBlock}
                        readOnly={readOnly}
                        isActive={activeBlockId === block.id}
                        onFocus={() => setActiveBlockId(block.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SortableContext>

          {!readOnly && (
            <div
              className="mt-4 p-2 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer flex items-center text-sm"
              onClick={() => {
                const lastId = blocks.length > 0 ? blocks[blocks.length - 1].id : null;
                onAddBlock('text', lastId);
              }}
              style={{
                transform: `translateY(${rowVirtualizer.getTotalSize()}px)`
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Click to append block
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}
