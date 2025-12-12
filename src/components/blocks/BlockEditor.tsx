import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  GripVertical, 
  Image as ImageIcon, 
  Type, 
  List, 
  CheckSquare, 
  Trash, 
  Plus, 
  ArrowUp, 
  ArrowDown,
  X
} from "lucide-react";
import { Block } from "@/types/workspace";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BlockEditorProps {
  blocks: Block[];
  onAddBlock: (type: Block['type'], afterBlockId: string | null) => void;
  onUpdateBlock: (id: string, content: string) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  readOnly?: boolean;
}

export function BlockEditor({ blocks, onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, readOnly = false }: BlockEditorProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleImageUpload = async (file: File, blockId: string) => {
    try {
      setUploading(blockId);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      
      onUpdateBlock(blockId, data.publicUrl);
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(null);
    }
  };

  if (blocks.length === 0 && !readOnly) {
    return (
      <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground cursor-pointer hover:bg-muted/50"
           onClick={() => onAddBlock('text', null)}>
        Click to add your first block
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <div key={block.id} className="group relative flex items-start gap-2">
          {/* Block Controls */}
          {!readOnly && (
            <div className="absolute -left-10 top-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              <div className="flex flex-col">
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => onMoveBlock(block.id, 'up')}>
                  <ArrowUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => onMoveBlock(block.id, 'down')}>
                  <ArrowDown className="w-3 h-3" />
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" align="start">
                  <div className="grid gap-1">
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => onDeleteBlock(block.id)}>
                      <Trash className="w-4 h-4 mr-2" /> Delete
                    </Button>
                    <div className="h-px bg-border my-1" />
                    <div className="text-xs px-2 py-1 text-muted-foreground">Insert Below</div>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => onAddBlock('text', block.id)}>
                      <Type className="w-4 h-4 mr-2" /> Text
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => onAddBlock('heading_1', block.id)}>
                      <Type className="w-4 h-4 mr-2 font-bold" /> Heading 1
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => onAddBlock('bullet_list', block.id)}>
                      <List className="w-4 h-4 mr-2" /> List
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => onAddBlock('to_do', block.id)}>
                      <CheckSquare className="w-4 h-4 mr-2" /> To-do
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => onAddBlock('image', block.id)}>
                      <ImageIcon className="w-4 h-4 mr-2" /> Image
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Block Content */}
          <div className="flex-1 min-h-[24px]">
            {block.type === 'text' && (
              <Textarea 
                value={block.content}
                onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                className="min-h-[24px] resize-none border-none shadow-none focus-visible:ring-0 p-0 leading-7"
                placeholder="Type something..."
                readOnly={readOnly}
              />
            )}
            
            {block.type === 'heading_1' && (
              <input
                value={block.content}
                onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="Heading 1"
                readOnly={readOnly}
              />
            )}

            {block.type === 'heading_2' && (
              <input
                value={block.content}
                onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="Heading 2"
                readOnly={readOnly}
              />
            )}

            {block.type === 'heading_3' && (
              <input
                value={block.content}
                onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                className="w-full text-xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="Heading 3"
                readOnly={readOnly}
              />
            )}

            {block.type === 'bullet_list' && (
              <div className="flex items-start gap-2">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground shrink-0" />
                <Textarea 
                  value={block.content}
                  onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                  className="min-h-[24px] resize-none border-none shadow-none focus-visible:ring-0 p-0 leading-7 flex-1"
                  placeholder="List item"
                  readOnly={readOnly}
                />
              </div>
            )}

            {block.type === 'to_do' && (
              <div className="flex items-start gap-2">
                <div className="mt-1.5">
                  <CheckSquare className={`w-4 h-4 ${block.properties?.checked ? 'text-primary' : 'text-muted-foreground'}`} 
                    onClick={() => !readOnly && onUpdateBlock(block.id, block.content)} // TODO: Handle property update separately or include in content update
                  />
                </div>
                <Textarea 
                  value={block.content}
                  onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                  className={`min-h-[24px] resize-none border-none shadow-none focus-visible:ring-0 p-0 leading-7 flex-1 ${block.properties?.checked ? 'line-through text-muted-foreground' : ''}`}
                  placeholder="To-do item"
                  readOnly={readOnly}
                />
              </div>
            )}

            {block.type === 'image' && (
              <div className="relative group/image">
                {block.content ? (
                  <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                    <img src={block.content} alt="Block content" className="max-w-full h-auto max-h-[500px] object-contain" />
                    {!readOnly && (
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity"
                        onClick={() => onUpdateBlock(block.id, "")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-colors">
                    {uploading === block.id ? (
                      <div className="animate-pulse">Uploading...</div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <div className="text-sm">Click to upload image</div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, block.id);
                          }}
                          disabled={readOnly}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {!readOnly && (
        <div 
          className="h-8 -ml-2 flex items-center text-muted-foreground/50 hover:text-muted-foreground cursor-text"
          onClick={() => onAddBlock('text', blocks.length > 0 ? blocks[blocks.length - 1].id : null)}
        >
          <Plus className="w-4 h-4 mr-2" /> Click to add a block
        </div>
      )}
    </div>
  );
}
