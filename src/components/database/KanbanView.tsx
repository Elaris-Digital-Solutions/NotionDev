import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseRow, DatabaseProperty } from "@/hooks/useDatabase";
import { usePageMutations } from "@/hooks/usePageMutations";
import { Link } from "react-router-dom";

interface KanbanViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
  pageId: string;
}

export function KanbanView({ rows, properties, pageId }: KanbanViewProps) {
  const { createChildPage, setPageProperty } = usePageMutations(pageId);

  // Find the status property to group by
  const statusProp = properties.find(p => p.type === 'status') || properties.find(p => p.name.toLowerCase() === 'status');
  
  // Default columns if no status property found or if it has no options
  // In a real app, we'd parse the options from the property definition
  const columns = statusProp?.options?.options || [
    { id: 'not-started', label: 'Not Started', color: 'gray' },
    { id: 'in-progress', label: 'In Progress', color: 'blue' },
    { id: 'completed', label: 'Completed', color: 'green' },
    { id: 'blocked', label: 'Blocked', color: 'red' },
  ];

  const getColumnRows = (colId: string) => {
    if (!statusProp) return [];
    return rows.filter(row => {
      const val = row.properties[statusProp.name];
      // Handle both simple string values and object values depending on how we store them
      return val === colId || val?.id === colId;
    });
  };

  const handleCreateNew = async (statusId: string) => {
    if (!statusProp) return;
    
    // 1. Create the page
    const newPage = await createChildPage.mutateAsync('Untitled');
    
    // 2. Set the status property
    if (newPage) {
      await setPageProperty.mutateAsync({
        pageId: newPage.id,
        propertyId: statusProp.id,
        value: statusId
      });
    }
  };

  if (!statusProp) {
    return <div className="p-8 text-muted-foreground">This view requires a "Status" property to group items.</div>;
  }

  return (
    <div className="flex-1 overflow-x-auto px-8 pb-8">
      <div className="flex gap-4 min-w-max h-full">
        {columns.map((col: any) => {
          const colRows = getColumnRows(col.id);
          return (
            <div key={col.id} className="w-72 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={col.id} />
                <span className="text-xs text-muted-foreground">
                  {colRows.length}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                {colRows.map((row) => (
                  <Link to={`/page/${row.id}`} key={row.id}>
                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm font-medium leading-tight flex items-center gap-2">
                          <span>{row.icon || '📄'}</span>
                          {row.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1 space-y-2">
                        {/* Render first few properties that aren't the grouping status */}
                        {properties.filter(p => p.id !== statusProp.id).slice(0, 3).map(prop => {
                           const val = row.properties[prop.name];
                           if (!val) return null;
                           return (
                             <div key={prop.id} className="text-xs text-muted-foreground truncate">
                               <span className="opacity-70 mr-1">{prop.name}:</span>
                               {String(val)}
                             </div>
                           );
                        })}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                <div 
                  onClick={() => handleCreateNew(col.id)}
                  className="p-2 rounded hover:bg-accent/50 text-muted-foreground text-sm cursor-pointer flex items-center gap-2"
                >
                    + New
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
