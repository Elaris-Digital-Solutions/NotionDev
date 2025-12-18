import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockEditor } from "@/components/blocks/BlockEditor";
import { Smile, Clock, User, AlertCircle, Circle } from "lucide-react";
import { CoverImage } from "@/components/common/CoverImage";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { useDatabaseMutations } from "@/hooks/useDatabaseMutations";
import { usePage } from "@/hooks/usePage";
import { usePageMutations } from "@/hooks/usePageMutations";
import { DatabaseView } from "@/components/views/DatabaseView";

interface PageViewProps {
  pageId: string;
}

export function PageView({ pageId }: PageViewProps) {
  const { page, blocks, isLoading } = usePage(pageId);
  // Use mutations for blocks
  const { updatePage, updateBlock, deleteBlock, createBlock, moveBlock } = usePageMutations(pageId);
  const { updatePropertyValue } = useDatabaseMutations();

  // Fetch Properties (If it's part of a database or team space)
  const { data: properties = {} } = useQuery({
    queryKey: ['pageProperties', pageId],
    queryFn: async () => {
      const { data: props } = await supabase
        .from('page_property_values')
        .select('*, database_properties(name)')
        .eq('page_id', pageId);

      const propMap: Record<string, any> = {};
      props?.forEach((p: any) => {
        if (p.database_properties?.name) {
          propMap[p.database_properties.name] = {
            value: p.value,
            id: p.database_properties.id, // We need property ID to update
            propId: p.property_id
          };
        }
      });
      return propMap;
    }
  });

  // Properties we want to show explicitly
  const displayProperties = ['Status', 'Priority', 'Due Date', 'Responsible'];

  if (isLoading) {
    return (
      <div className="flex-1 p-8 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!page) return <div>Page not found</div>;
  if (page.type === 'database') {
    return <DatabaseView title={page.title} icon={page.icon || undefined} pageId={page.id} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background animate-fade-up">
      <div className="h-48 bg-gradient-to-r from-pink-100 to-blue-100 w-full group relative">
        {page.cover_image && <img src={page.cover_image} alt="Cover" className="w-full h-full object-cover" />}
        <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Change cover
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-12 pb-32 -mt-12 relative z-10">
        {/* Icon & Title */}
        <div className="group relative mb-4">
          <div className="text-7xl mb-4 hover:bg-accent/20 w-fit rounded p-2 cursor-pointer transition-colors">
            {page.icon || '📄'}
          </div>
          <h1
            className="text-4xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const newTitle = e.currentTarget.textContent;
              if (newTitle && newTitle !== page.title) {
                updatePage.mutate({ title: newTitle || 'Untitled' });
              }
            }}
          >
            {page.title}
          </h1>
        </div>

        {/* Properties Panel */}
        <div className="flex flex-col gap-2 mb-8 border-b pb-4">
          {displayProperties.map(propName => {
            const propData = properties[propName];
            // Only show if we have data OR if we want to allow adding it?
            // For now, let's just attempt to show placeholders if missing is tricky without property IDs.
            // Actually, useDatabase ensures properties exist for database.
            // If this is a random page, it might not have them.

            // Hack: If we don't have the property ID, we can't edit it easily without fetching definitions.
            // But for Team Spaces, useDatabase should have created them? 
            // Wait, useDatabase runs on DatabaseView. 
            // We might need to ensure properties exist here too.

            if (!propData) return null; // Skip if property doesn't exist on this page's "database" context

            return (
              <div key={propName} className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-muted-foreground text-sm">
                  {getPropIcon(propName)}
                  <span>{propName}</span>
                </div>
                <div className="flex-1 text-sm">
                  <PropertyEditor
                    type={getPropType(propName)}
                    value={propData.value}
                    onChange={(val) => updatePropertyValue.mutate({ pageId, propertyId: propData.propId, value: val })}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Content */}
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

function getPropIcon(name: string) {
  if (name === 'Status') return <Circle className="w-4 h-4" />;
  if (name === 'Priority') return <AlertCircle className="w-4 h-4" />;
  if (name === 'Due Date') return <Clock className="w-4 h-4" />;
  if (name === 'Responsible') return <User className="w-4 h-4" />;
  return <Smile className="w-4 h-4" />;
}

function getPropType(name: string) {
  if (name === 'Status') return 'status';
  if (name === 'Priority') return 'priority';
  if (name === 'Due Date') return 'date';
  if (name === 'Responsible') return 'person';
  return 'text';
}

function PropertyEditor({ type, value, onChange }: { type: string, value: any, onChange: (val: any) => void }) {
  if (type === 'status') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 border-none shadow-none w-fit p-0 h-auto hover:bg-muted/50 px-2 rounded">
          <StatusBadge status={value} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not-started">Not Started</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  if (type === 'priority') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 border-none shadow-none w-fit p-0 h-auto hover:bg-muted/50 px-2 rounded">
          <PriorityBadge priority={value} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  if (type === 'date') {
    const date = value ? new Date(value) : undefined;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-7 p-1 px-2 text-sm justify-start font-normal hover:bg-muted/50">
            {date ? format(date, "PPP") : <span className="text-muted-foreground">Empty</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d?.toISOString())}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
  // Person (Mock for now)
  if (type === 'person') {
    return <div className="px-2 py-0.5 hover:bg-muted/50 rounded cursor-text">{value || <span className="text-muted-foreground">Empty</span>}</div>;
  }

  return <div className="px-2 py-0.5 hover:bg-muted/50 rounded cursor-text">{value || <span className="text-muted-foreground">Empty</span>}</div>;
}
