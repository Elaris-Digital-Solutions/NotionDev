import { Block } from "@/types/workspace";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, FileCode, Info, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BlockRendererProps {
  block: Block;
  onUpdate?: (id: string, updates: Partial<Block>) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export function BlockRenderer({ block, onUpdate, onDelete, readOnly = false }: BlockRendererProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (!readOnly && onUpdate && e.currentTarget.textContent !== block.content) {
      onUpdate(block.id, { content: e.currentTarget.textContent || '' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
      // Ideally trigger creation of new block here
    }
  };

  const commonProps = {
    contentEditable: !readOnly,
    suppressContentEditableWarning: true,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    className: "outline-none min-w-[1px]"
  };

  switch (block.type) {
    case 'h1':
      return <h1 {...commonProps} className={cn("text-3xl font-bold mt-6 mb-2", commonProps.className)}>{block.content}</h1>;
    case 'h2':
      return <h2 {...commonProps} className={cn("text-2xl font-semibold mt-5 mb-2", commonProps.className)}>{block.content}</h2>;
    case 'h3':
      return <h3 {...commonProps} className={cn("text-xl font-semibold mt-4 mb-2", commonProps.className)}>{block.content}</h3>;
    case 'text':
      return <p {...commonProps} className={cn("min-h-[24px] py-1 text-foreground/90", commonProps.className)}>{block.content}</p>;
    case 'bullet-list':
      return (
        <div className="flex items-start gap-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 ml-1" />
          <p {...commonProps} className={commonProps.className}>{block.content}</p>
        </div>
      );
    case 'numbered-list':
      return (
        <div className="flex items-start gap-2 py-1">
          <span className="text-foreground font-medium min-w-[20px]">1.</span>
          <p {...commonProps} className={commonProps.className}>{block.content}</p>
        </div>
      );
    case 'todo':
      return (
        <div className="flex items-start gap-2 py-1">
          <Checkbox 
            checked={block.properties?.checked} 
            onCheckedChange={(checked) => onUpdate?.(block.id, { properties: { ...block.properties, checked } })}
            disabled={readOnly}
            className="mt-1" 
          />
          <p 
            {...commonProps} 
            className={cn(block.properties?.checked && "line-through text-muted-foreground", commonProps.className)}
          >
            {block.content}
          </p>
        </div>
      );
    case 'quote':
      return (
        <blockquote {...commonProps} className={cn("border-l-4 border-foreground pl-4 py-1 my-2 italic text-muted-foreground", commonProps.className)}>
          {block.content}
        </blockquote>
      );
    case 'toggle':
      return (
        <div className="py-1">
          <div 
            className="flex items-center gap-1 hover:bg-accent/50 rounded p-0.5 -ml-1"
          >
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer p-0.5">
                <ChevronRight className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} />
            </div>
            <span {...commonProps} className={cn("font-medium flex-1", commonProps.className)}>{block.content}</span>
          </div>
          {isOpen && block.children && (
            <div className="pl-6 mt-1">
              {block.children.map(child => (
                <BlockRenderer 
                    key={child.id} 
                    block={child} 
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    readOnly={readOnly}
                />
              ))}
            </div>
          )}
        </div>
      );
    case 'callout':
      return (
        <div className="flex gap-3 p-4 bg-accent/30 rounded-md my-2 border border-border">
          <span className="text-xl select-none">{block.properties?.icon || '💡'}</span>
          <div className="flex-1">
            <p {...commonProps} className={cn("font-medium", commonProps.className)}>{block.content}</p>
          </div>
        </div>
      );
    case 'divider':
      return <hr className="my-4 border-border" />;
    case 'code':
      return (
        <div className="bg-muted/50 rounded-md p-4 my-2 font-mono text-sm relative group">
            <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
                {block.properties?.language || 'javascript'}
            </div>
            <pre>{block.content}</pre>
        </div>
      );
    case 'image':
        return (
            <div className="my-4 rounded-lg overflow-hidden border border-border">
                <img src={block.properties?.url || "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba"} alt="Block content" className="w-full h-64 object-cover" />
                {block.content && <div className="p-2 text-xs text-muted-foreground bg-muted/30">{block.content}</div>}
            </div>
        );
    case 'bookmark':
        return (
            <div className="flex gap-4 border border-border rounded-md p-3 my-2 hover:bg-accent/30 cursor-pointer transition-colors">
                <div className="flex-1 space-y-1">
                    <div className="font-medium truncate">{block.content}</div>
                    <div className="text-xs text-muted-foreground truncate">{block.properties?.url}</div>
                </div>
                <div className="w-24 h-16 bg-muted rounded flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-muted-foreground" />
                </div>
            </div>
        );
    default:
      return <div className="text-red-500">Unknown block type: {block.type}</div>;
  }
}
