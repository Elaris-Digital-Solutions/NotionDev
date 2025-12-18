import { useState } from "react";
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
import { useDatabaseMutations } from "@/hooks/useDatabaseMutations";
import { Plus, MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TableViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
  pageId: string;
  databaseId?: string;
}

export function TableView({ rows, properties, pageId, databaseId }: TableViewProps) {
  const { addProperty, deleteProperty, updatePropertyValue } = useDatabaseMutations(databaseId);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState("text");
  const [isAddPropOpen, setIsAddPropOpen] = useState(false);

  const handleAddProperty = () => {
    if (!newPropName) return;
    addProperty.mutate({ name: newPropName, type: newPropType as any });
    setNewPropName("");
    setIsAddPropOpen(false);
  };

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
              <TableHead key={prop.id} className="text-muted-foreground font-medium min-w-[150px] group">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">#</span>
                    {prop.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteProperty.mutate(prop.id)}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[50px]">
              <Popover open={isAddPropOpen} onOpenChange={setIsAddPropOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Add Property</h4>
                      <p className="text-sm text-muted-foreground">
                        Add a new column to your database.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Input
                        id="name"
                        placeholder="Property name"
                        value={newPropName}
                        onChange={(e) => setNewPropName(e.target.value)}
                      />
                      <Select value={newPropType} onValueChange={setNewPropType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddProperty}>Add</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </TableHead>
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
                <TableCell key={prop.id} className="p-0">
                  <EditableCell
                    value={row.properties[prop.name]}
                    type={prop.type}
                    onChange={(value) => updatePropertyValue.mutate({ pageId: row.id, propertyId: prop.id, value })}
                  />
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EditableCell({ value, type, onChange }: { value: any; type: string; onChange: (val: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  if (isEditing) {
    if (type === 'status') {
      return (
        <Select value={localValue} onValueChange={(val) => { setLocalValue(val); onChange(val); setIsEditing(false); }}>
          <SelectTrigger className="h-8 border-none shadow-none">
            <SelectValue />
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
        <Select value={localValue} onValueChange={(val) => { setLocalValue(val); onChange(val); setIsEditing(false); }}>
          <SelectTrigger className="h-8 border-none shadow-none">
            <SelectValue />
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
      return (
        <Input
          type="date"
          className="h-8 border-none shadow-none focus-visible:ring-0"
          value={localValue || ''}
          onChange={(e) => {
            const val = e.target.value;
            setLocalValue(val);
            onChange(val);
            // Don't close immediately for date to allow selection? Actually date input blur handles it.
          }}
          onBlur={handleBlur}
          autoFocus
        />
      );
    }
    // For 'person', we ideally need a list of users. For now, simple text fallback or mock select.
    // Real implementation requires fetching workspace members.
    if (type === 'person') {
      return (
        <Input
          className="h-8 border-none shadow-none focus-visible:ring-0"
          placeholder="@user..."
          value={localValue || ''}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          autoFocus
        />
      );
    }

    return (
      <Input
        className="h-8 border-none shadow-none focus-visible:ring-0"
        value={localValue || ''}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        autoFocus
      />
    );
  }

  return (
    <div
      className="min-h-[32px] flex items-center px-4 cursor-pointer hover:bg-muted/50"
      onClick={() => { setLocalValue(value); setIsEditing(true); }}
    >
      {renderPropertyValue(value, type)}
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
    case 'date':
      return <span>{value ? new Date(value).toLocaleDateString() : '-'}</span>;
    case 'person':
      return <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{String(value)}</span>;
    case 'text':
    default:
      return <span>{String(value)}</span>;
  }
}
