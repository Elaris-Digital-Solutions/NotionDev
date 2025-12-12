import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { FileText } from "lucide-react";
import { DatabaseRow, DatabaseProperty } from "@/hooks/useDatabase";
import { Link } from "react-router-dom";

interface ListViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
  pageId: string;
}

export function ListView({ rows, properties, pageId }: ListViewProps) {
  return (
    <div className="flex-1 overflow-auto px-8 pb-8 max-w-3xl mx-auto">
      <div className="space-y-1">
        {rows.map((row) => (
          <Link 
            to={`/page/${row.id}`}
            key={row.id}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer group"
          >
            <div className="p-1 rounded bg-muted text-muted-foreground">
                <span className="text-sm">{row.icon || <FileText className="w-4 h-4" />}</span>
            </div>
            <span className="flex-1 font-medium text-sm">{row.title}</span>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {properties.slice(0, 3).map(prop => {
                    const val = row.properties[prop.name];
                    if (!val) return null;
                    return (
                        <div key={prop.id} className="text-xs text-muted-foreground">
                            {String(val)}
                        </div>
                    );
                })}
                <span className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString()}
                </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
