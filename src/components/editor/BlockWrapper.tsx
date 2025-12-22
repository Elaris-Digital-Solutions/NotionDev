import { useCallback } from 'react';
import { TiptapBlock } from './TiptapBlock';
import { BlockRenderer } from './BlockRenderer';
import { Block } from '@/types/workspace';
import { GripVertical, X, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BlockWrapperProps {
  block: Block;
  onUpdate: (id: string, content: any, plainText: string, version: number) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  isActive?: boolean;
  onFocus?: () => void;
}

export function BlockWrapper({ block, onUpdate, onDelete, readOnly = false, isActive = false, onFocus }: BlockWrapperProps) {

  const handleUpdate = useCallback((newContent: any, plainText: string) => {
    // Only update if changed? 
    // Ideally we diff here.
    if (JSON.stringify(newContent) !== JSON.stringify(block.content)) {
      // Optimistic version increment handled by mutation, but we pass current version
      onUpdate(block.id, newContent, plainText, block.version);
    }
  }, [block.id, block.content, block.version, onUpdate]);

  const handleClick = () => {
    if (!readOnly && onFocus) onFocus();
  };

  // Guard: If content is null (from migration edge cases?), render empty
  const content = block.content || { type: 'doc', content: [{ type: 'paragraph' }] };

  return (
    <div className="group relative flex items-start gap-2 py-1">
      {/* Block Controls (Hover) */}
      {!readOnly && (
        <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 flex items-center transition-opacity select-none">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1" align="start">
              <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={() => onDelete(block.id)}>
                <Trash className="w-4 h-4 mr-2" /> Delete
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {isActive ? (
          <TiptapBlock
            content={content}
            onUpdate={handleUpdate}
            onBlur={() => { }} // blur handled by parent focus change usually, but we keep this hook
            autoFocus={true}
          />
        ) : (
          <BlockRenderer
            content={content}
            onClick={handleClick}
          />
        )}
      </div>
    </div>
  );
}
