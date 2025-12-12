import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DatabaseRow, DatabaseProperty } from "@/hooks/useDatabase";
import { Link } from "react-router-dom";

interface TableViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
}

export function TableView({ rows, properties }: TableViewProps) {
  if (rows.length === 0) {
    return <div className="p-8 text-muted-foreground">No items in this database.</div>;
  }

  return (
    <div className="flex-1 overflow-auto px-8 pb-8">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium w-[200px]">
              <div className="flex items-center gap-1">
                <span className="text-xs">Aa</span>
                Name
              </div>
            </TableHead>
            {properties.map(prop => (
              <TableHead key={prop.id} className="text-muted-foreground font-medium min-w-[150px]">
                <div className="flex items-center gap-1">
                  <span className="text-xs">#</span>
                  {prop.name}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="border-border group">
              <TableCell className="font-medium">
                <Link to={`/page/${row.id}`} className="flex items-center gap-2 hover:underline">
                  {row.icon || '📄'} {row.title}
                </Link>
              </TableCell>
              {properties.map(prop => (
                <TableCell key={prop.id}>
                  {renderPropertyValue(row.properties[prop.name], prop.type)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function renderPropertyValue(value: any, type: string) {
  if (!value) return <span className="text-muted-foreground/30">-</span>;
  
  switch (type) {
    case 'status':
      return <StatusBadge status={value} />;
    case 'priority':
      return <PriorityBadge priority={value} />;
    case 'progress':
      return <ProgressBar value={value} />;
    case 'text':
    default:
      return <span>{String(value)}</span>;
  }
}
