import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { BlockEditor } from "@/components/blocks/BlockEditor";
import { Smile, Clock, User, AlertCircle, Circle } from "lucide-react";
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
import { useEnsureSystemDatabase } from "@/hooks/useEnsureSystemDatabase";
import { useAuth } from "@/components/providers/AuthProvider";

interface PageViewProps {
  pageId: string;
}

export function PageView({ pageId }: PageViewProps) {
  const { page, blocks, isLoading } = usePage(pageId);
  // Use mutations for blocks
  const { updatePage, updateBlock, deleteBlock, createBlock, reorderBlock } = usePageMutations(pageId);
  const { updatePropertyValue } = useDatabaseMutations();

  // 2. Ensure System Database & Get Definitions
  const { properties: definitions = [] } = useEnsureSystemDatabase(page?.team_space_id || undefined, !page?.team_space_id);

  // Fetch Current Values
  const { data: values = {} } = useQuery({
    queryKey: ['pagePropertyValues', pageId],
    queryFn: async () => {
      const { data: props } = await supabase
        .from('page_property_values')
        .select('*, database_properties(name)')
        .eq('page_id', pageId);

      const valMap: Record<string, any> = {};
      props?.forEach((p: any) => {
        if (p.database_properties?.name) {
          valMap[p.database_properties.name] = {
            value: p.value,
            propId: p.property_id // The ID of the value row if we needed to update specific row, but we usually upsert by page_id + property_id
          };
        }
      });
      return valMap;
    },
    enabled: !!pageId
  });

  // Combine Definitions with Values
  // We want to show all definitions.
  // We need the property definition ID to update.

  // Fetch Members (if in team space) or Self (if private)
  const { user } = useAuth();
  const { data: members = [] } = useQuery({
    queryKey: ['pageMembers', page?.team_space_id],
    queryFn: async () => {
      if (!page?.team_space_id) {
        // Private: Just me
        return user ? [{ id: user.id, full_name: user.user_metadata?.full_name || 'Me', email: user.email }] : [];
      }
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id, profiles(id, email, full_name)')
        .eq('team_id', page.team_space_id);

      if (error) return [];
      // @ts-ignore
      return data.map(d => d.profiles).filter(Boolean);
    },
    enabled: !!page
  });



  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-background animate-fade-up p-12">
        <Skeleton className="h-48 w-full mb-8 rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!page) return <div className="flex-1 flex items-center justify-center text-muted-foreground">Page not found</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-background animate-fade-up">
      <div className="h-48 bg-gradient-to-r from-pink-100 to-blue-100 w-full group relative">
        {page?.cover_image && <img src={page.cover_image} alt="Cover" className="w-full h-full object-cover" />}
        <Button variant="secondary" size="sm" className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Change cover
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-12 pb-32 -mt-12 relative z-10">
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
          {definitions.map((def: any) => {
            const currentVal = values[def.name]?.value;
            return (
              <div key={def.id} className="flex items-center h-8">
                <div className="w-32 flex items-center gap-2 text-muted-foreground text-sm">
                  {getPropIcon(def.name)}
                  <span>{def.name}</span>
                </div>
                <div className="flex-1 text-sm">
                  <PropertyEditor
                    type={def.type}
                    value={currentVal}
                    onChange={(val) => updatePropertyValue.mutate({ pageId, propertyId: def.id, value: val })}
                    members={members}
                  />
                </div>
              </div>
            );
          })}
        </div>

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
            onUpdateBlock={(id, content, plainText, version) => updateBlock.mutate({ blockId: id, content, plainText, version })}
            onDeleteBlock={(id) => deleteBlock.mutate(id)}
            onReorderBlock={(activeId, overId) => reorderBlock.mutate({ activeId, overId })}
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

function PropertyEditor({ type, value, onChange, members = [] }: { type: string, value: any, onChange: (val: any) => void, members?: any[] }) {
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

  if (type === 'person') {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 border-none shadow-none w-fit p-0 h-auto hover:bg-muted/50 px-2 rounded">
          <SelectValue placeholder="Empty" />
        </SelectTrigger>
        <SelectContent>
          {members.length === 0 ? <div className="p-2 text-xs">No members</div> :
            members.map(m => (
              <SelectItem key={m.id} value={m.full_name || m.email}>
                {m.full_name || m.email}
              </SelectItem>
            ))
          }
        </SelectContent>
      </Select>
    );
  }

  return <div className="px-2 py-0.5 hover:bg-muted/50 rounded cursor-text">{value || <span className="text-muted-foreground">Empty</span>}</div>;
}
