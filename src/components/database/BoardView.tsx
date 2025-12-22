import { useState, useMemo } from "react";
import { DatabaseRow, DatabaseProperty } from "@/hooks/useDatabase";
import { useDatabaseMutations } from "@/hooks/useDatabaseMutations";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from "@dnd-kit/core";
import { createPortal } from "react-dom";

interface BoardViewProps {
    rows: DatabaseRow[];
    properties: DatabaseProperty[];
    pageId: string;
}

export function BoardView({ rows, properties, pageId }: BoardViewProps) {
    // 1. Find Grouping Property (Status or Select)
    const groupProperty = useMemo(() =>
        properties.find(p => p.type === 'status' || p.type === 'select'),
        [properties]);

    const { updatePropertyValue } = useDatabaseMutations(undefined); // DatabaseId inferred? No, need to pass it or just use mutation.

    const [activeId, setActiveId] = useState<string | null>(null);

    const columns = useMemo(() => {
        if (!groupProperty) return [];

        // Get options from config
        const options = groupProperty.config?.options || [];

        // Create columns map
        const cols = options.map((opt: any) => ({
            id: opt.name,
            name: opt.name,
            color: opt.color,
            items: rows.filter(r => r.properties[groupProperty.name] === opt.name)
        }));

        // Add "No Status" column if needed?
        // Notion usually has "No Status" as first column
        const noStatusItems = rows.filter(r => !r.properties[groupProperty.name]);
        if (noStatusItems.length > 0) {
            cols.unshift({ id: '_no_status', name: 'No Status', color: 'gray', items: noStatusItems });
        }

        return cols;
    }, [groupProperty, rows]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || !groupProperty) return;

        const rowId = active.id as string;
        const newStatus = over.id as string; // The dropping column ID is the status name

        // Optimistically update? Or just mutate
        // If dropped on check container
        if (newStatus !== '_no_status') {
            updatePropertyValue.mutate({
                pageId: rowId,
                propertyId: groupProperty.id,
                value: newStatus
            });
        } else {
            // Clear status
            updatePropertyValue.mutate({
                pageId: rowId,
                propertyId: groupProperty.id,
                value: null
            });
        }
    };

    if (!groupProperty) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
                No "Status" or "Select" property found to group by. Add one to use Board View.
            </div>
        );
    }

    return (
        <DndContext onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
            <div className="flex-1 overflow-x-auto overflow-y-hidden h-full p-4">
                <div className="flex gap-4 h-full min-w-max">
                    {columns.map(col => (
                        <BoardColumn key={col.id} column={col} />
                    ))}
                </div>
            </div>
            {createPortal(
                <DragOverlay>
                    {activeId ? (
                        <div className="bg-background border rounded shadow-lg p-3 w-[250px] opacity-80 cursor-grabbing">
                            Dragging...
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}

function BoardColumn({ column }: { column: any }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div ref={setNodeRef} className="w-[260px] flex flex-col h-full rounded-lg bg-muted/20 border border-transparent hover:border-border/50 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-2 p-2 px-3 border-b mb-2">
                <Badge variant="outline" className={cn("font-medium", column.color ? `bg-${column.color}-100 text-${column.color}-800 border-none` : "")}>
                    {column.name}
                </Badge>
                <span className="text-xs text-muted-foreground">{column.items.length}</span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2">
                {column.items.map((item: DatabaseRow) => (
                    <BoardCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}

function BoardCard({ item }: { item: DatabaseRow }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "bg-background p-3 rounded shadow-sm border text-sm hover:bg-accent/5 cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50"
            )}
        >
            <Link to={`/page/${item.id}`} className="font-medium hover:underline block mb-1">
                {item.icon} {item.title || "Untitled"}
            </Link>
            {/* Show other properties broadly? */}
            {/* For MVP just title is fine */}
        </div>
    );
}
