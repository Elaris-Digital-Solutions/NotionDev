import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; // Generic generic badge
import { ProgressBar } from "@/components/ui/progress-bar";
import { DatabaseRow, DatabaseProperty } from "@/hooks/useDatabase";
import { Link } from "react-router-dom";
import { useDatabaseMutations } from "@/hooks/useDatabaseMutations";
import { Plus, Trash, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TableViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
  pageId: string;
  databaseId?: string;
  members?: any[]; // Users for 'person' column
}

export function TableView({ rows, properties, pageId, databaseId, members = [] }: TableViewProps) {
  const { addProperty, deleteProperty, updatePropertyValue, updateProperty } = useDatabaseMutations(databaseId);
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState("text");
  const [isAddPropOpen, setIsAddPropOpen] = useState(false);

  // Filter & Sort State
  const [activeFilters, setActiveFilters] = useState<{ propertyId: string, value: string }[]>([]);
  const [activeSort, setActiveSort] = useState<{ propertyId: string, direction: 'asc' | 'desc' } | null>(null);

  const handleAddProperty = () => {
    if (!newPropName) return;
    addProperty.mutate({ name: newPropName, type: newPropType as any, position: properties.length });
    setNewPropName("");
    setIsAddPropOpen(false);
  };

  const handleCreateOption = (property: DatabaseProperty, newValue: string) => {
    if (!databaseId) return;
    const currentOptions = property.config?.options || [];
    const newOption = {
      id: crypto.randomUUID(),
      name: newValue,
      color: "gray"
    };
    const newConfig = {
      ...property.config,
      options: [...currentOptions, newOption]
    };

    updateProperty.mutate({
      id: property.id,
      updates: { config: newConfig }
    });
  };

  // Client-side Filter & Sort Logic
  const processedRows = rows.filter(row => {
    if (activeFilters.length === 0) return true;
    return activeFilters.every(filter => {
      const prop = properties.find(p => p.id === filter.propertyId);
      if (!prop) return true;
      const val = row.properties[prop.name];
      if (!filter.value) return true; // Empty filter ignores
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(filter.value.toLowerCase());
    });
  }).sort((a, b) => {
    if (!activeSort) return 0;
    const prop = properties.find(p => p.id === activeSort.propertyId);
    if (!prop) return 0; // Should not happen

    // Check for Name column special case if we supported sorting by name, but here we sort by props
    // We don't have ID for "Name" column in properties list usually, it's hardcoded. 
    // If activeSort.propertyId === 'name' ... handled separately? For now only props.

    const valA = a.properties[prop.name] || '';
    const valB = b.properties[prop.name] || '';

    if (valA < valB) return activeSort.direction === 'asc' ? -1 : 1;
    if (valA > valB) return activeSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (rows.length === 0) {
    return <div className="p-8 text-muted-foreground">No items in this database.</div>;
  }

  return (
    <div className="flex-1 overflow-auto px-8 pb-8">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 border-b pb-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-7 px-2", activeSort ? "text-blue-600 bg-blue-50" : "text-muted-foreground")}>
              <ChevronsUpDown className="w-3.5 h-3.5 mr-1.5" />
              Sort
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Sort by</div>
            {properties.map(p => (
              <div key={p.id} className="flex items-center justify-between p-1.5 hover:bg-muted rounded cursor-pointer"
                onClick={() => setActiveSort({ propertyId: p.id, direction: activeSort?.propertyId === p.id && activeSort.direction === 'asc' ? 'desc' : 'asc' })}
              >
                <span className="text-sm">{p.name}</span>
                {activeSort?.propertyId === p.id && (
                  <span className="text-xs text-blue-600">{activeSort.direction === 'asc' ? 'Asc' : 'Desc'}</span>
                )}
              </div>
            ))}
            {activeSort && (
              <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs text-muted-foreground" onClick={() => setActiveSort(null)}>
                Clear sort
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-7 px-2", activeFilters.length > 0 ? "text-blue-600 bg-blue-50" : "text-muted-foreground")}>
              <div className="flex items-center">
                <span className="mr-1.5">Filter</span>
                {activeFilters.length > 0 && <Badge variant="secondary" className="h-5 px-1 text-[10px]">{activeFilters.length}</Badge>}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="start">
            <div className="space-y-4">
              {activeFilters.map((filter, index) => {
                const prop = properties.find(p => p.id === filter.propertyId);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm w-24 truncate font-medium">{prop?.name}</span>
                    <Input
                      className="h-7 text-xs"
                      placeholder="Contains..."
                      value={filter.value}
                      onChange={(e) => {
                        const newFilters = [...activeFilters];
                        newFilters[index].value = e.target.value;
                        setActiveFilters(newFilters);
                      }}
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveFilters(activeFilters.filter((_, i) => i !== index))}>
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}

              <div className="pt-2 border-t">
                <Select onValueChange={(propId) => setActiveFilters([...activeFilters, { propertyId: propId, value: '' }])}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="+ Add filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto w-px h-4 bg-border mx-2" />
        <span className="text-xs text-muted-foreground">{processedRows.length} rows</span>
      </div>

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
                  {properties.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteProperty.mutate(prop.id)}
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  )}
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
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="multi_select">Multi-select</SelectItem>
                          <SelectItem value="status">Status</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="person">Person</SelectItem>
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
          {processedRows.map((row) => (
            <TableRow key={row.id} className="border-border group">
              <TableCell className="font-medium">
                <Link to={`/page/${row.id}`} className="flex items-center gap-2 hover:underline">
                  {row?.icon || '📄'} {row?.title}
                </Link>
              </TableCell>
              {properties.map(prop => (
                <TableCell key={prop.id} className="p-0">
                  <EditableCell
                    value={row.properties[prop.name]}
                    property={prop}
                    onChange={(value) => updatePropertyValue.mutate({ pageId: row.id, propertyId: prop.id, value })}
                    members={members}
                    onCreateOption={(val) => handleCreateOption(prop, val)}
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

interface EditableCellProps {
  value: any;
  property: DatabaseProperty;
  onChange: (val: any) => void;
  members?: any[];
  onCreateOption: (val: string) => void;
}

function EditableCell({ value, property, onChange, members = [], onCreateOption }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const type = property.type;

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  // Select / Status / Priority Handler
  if (['select', 'status', 'priority'].includes(type)) {
    const options = property.config?.options || [];

    // Find selected option object for display
    const selectedOption = options.find((opt: any) => opt.name === value);

    // Function to handle selection
    const onSelect = (val: string) => {
      onChange(val);
      setIsEditing(false);
    };

    return (
      <Popover open={isEditing} onOpenChange={setIsEditing}>
        <PopoverTrigger asChild>
          <div
            className="min-h-[32px] flex items-center px-4 cursor-pointer hover:bg-muted/50 w-full"
            role="button"
          >
            {value ? (
              <Badge className={cn("font-normal", selectedOption?.color ? `bg-${selectedOption.color}-100 text-${selectedOption.color}-800` : "bg-secondary text-secondary-foreground")}>
                {value}
              </Badge>
            ) : <span className="text-muted-foreground/30">Empty</span>}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[200px]" align="start">
          <Command>
            <CommandInput placeholder="Search or create..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-sm text-center">
                  <p className="text-muted-foreground mb-2">No option found.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      // We need to get the search value from CommandInput... 
                      // A bit tricky without controlled Command state.
                      // For MVP, we pass a create handler that triggers on Enter if implemented or we just use simpler input.
                      // cmdk doesn't easily expose current search value in Empty.
                      // We will assume user typed something.
                      // Actually, let's make this simple: user types, if no match, generic 'Create' button appears?
                      // cmdk is declarative.
                      // Let's use a controlled input approach if needed, but for now just "Create 'SearchTerm'"
                    }}
                  >
                    Create options (Type & Enter)
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {options.map((opt: any) => (
                  <CommandItem
                    key={opt.id || opt.name}
                    value={opt.name}
                    onSelect={() => onSelect(opt.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Badge className={cn("font-normal", opt.color ? `bg-${opt.color}-100` : "")}>
                      {opt.name}
                    </Badge>
                  </CommandItem>
                ))}
                {/* "Create" Item logic requires accessing the search query. 
                      Standard cmdk pattern: Use state for search.
                  */}
              </CommandGroup>
              <CreateOptionItem options={options} onCreate={onCreateOption} onSelect={onSelect} />
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  if (isEditing) {
    if (type === 'date') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-8 w-full justify-start font-normal">
              {localValue ? format(new Date(localValue), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={localValue ? new Date(localValue) : undefined}
              onSelect={(d) => {
                const val = d?.toISOString();
                setLocalValue(val);
                onChange(val);
                setIsEditing(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }
    // Real implementation requires fetching workspace members.
    if (type === 'person') {
      return (
        <Select value={localValue} onValueChange={(val) => { setLocalValue(val); onChange(val); setIsEditing(false); }}>
          <SelectTrigger className="h-8 border-none shadow-none">
            <SelectValue placeholder="@user" />
          </SelectTrigger>
          <SelectContent>
            {members.map(member => (
              <SelectItem key={member.id} value={member.full_name || member.email || 'Unknown'}>
                {member.full_name || member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

  // Read-only view
  return (
    <div
      className="min-h-[32px] flex items-center px-4 cursor-pointer hover:bg-muted/50"
      onClick={() => { setLocalValue(value); setIsEditing(true); }}
    >
      {renderPropertyValue(value, property)}
    </div>
  );
}

// Special component to handle creation inside Command
function CreateOptionItem({ options, onCreate, onSelect }: { options: any[], onCreate: (val: string) => void, onSelect: (val: string) => void }) {
  // Access command context? No, just generic item that shows when search doesn't match?
  // CMDK doesn't expose search state easily to children without context consumer.
  // We'll rely on a workaround: checking if current search is in options.
  // BUT we don't have search state here. 
  // We'll use a wrapper in the future. For now, we allow creating "New Option" if search is not empty?
  // We will assume the user has typed something if this item is shown (CommandEmpty is usually used).

  // Simplified: If you want to create, you usually just type and if it's not there, you want a button.
  // We'll use the CommandEmpty slot for the button actually.
  return null;
}

function renderPropertyValue(value: any, property: DatabaseProperty) {
  if (!value) return <span className="text-muted-foreground/30">-</span>;
  const type = property.type;

  if (['select', 'status', 'priority'].includes(type)) {
    const option = property.config?.options?.find((o: any) => o.name === value);
    return (
      <Badge className={cn("font-normal", option?.color ? `bg-${option.color}-100 text-${option.color}-800` : "bg-primary/10 text-primary")}>
        {value}
      </Badge>
    );
  }

  switch (type) {
    case 'progress':
      return <ProgressBar value={value} />;
    case 'date':
      return <span>{value ? new Date(value).toLocaleDateString() : '-'}</span>;
    case 'person':
      return <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{String(value)}</span>;
    case 'text':
    default:
      return <span className="truncate max-w-[200px] block">{String(value)}</span>;
  }
}

