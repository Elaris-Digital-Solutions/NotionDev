import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Settings2, Type, Hash, Calendar, CheckSquare, List, Users, Link as LinkIcon, Mail, Phone } from "lucide-react";
import { DatabaseColumn } from "@/types/workspace";

interface DatabasePropertiesProps {
  columns: DatabaseColumn[];
  onAddColumn: (column: Omit<DatabaseColumn, 'id'>) => void;
  onUpdateColumn: (id: string, updates: Partial<DatabaseColumn>) => void;
  onDeleteColumn: (id: string) => void;
}

const PROPERTY_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'select', label: 'Select', icon: List },
  { value: 'multi_select', label: 'Multi-select', icon: List },
  { value: 'status', label: 'Status', icon: CheckSquare },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'person', label: 'Person', icon: Users },
  { value: 'files', label: 'Files & Media', icon: LinkIcon },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'url', label: 'URL', icon: LinkIcon },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
];

export function DatabaseProperties({ columns, onAddColumn, onUpdateColumn, onDeleteColumn }: DatabasePropertiesProps) {
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState<DatabaseColumn['type']>('text');
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (!newColName) return;
    onAddColumn({
      name: newColName,
      type: newColType,
      options: []
    });
    setNewColName("");
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
      {columns.map((col) => {
        const Icon = PROPERTY_TYPES.find(t => t.value === col.type)?.icon || Type;
        return (
          <Popover key={col.id}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 border border-dashed text-muted-foreground hover:text-foreground">
                <Icon className="w-3 h-3 mr-2" />
                {col.name}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Property Name</Label>
                  <Input 
                    value={col.name} 
                    onChange={(e) => onUpdateColumn(col.id, { name: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select 
                    value={col.type} 
                    onValueChange={(v: any) => onUpdateColumn(col.id, { type: v })}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon className="w-3 h-3" /> {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full h-8"
                  onClick={() => onDeleteColumn(col.id)}
                >
                  Delete Property
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <Plus className="w-4 h-4 mr-1" /> Add Property
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-3">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">New Property</h4>
            <Input 
              placeholder="Property name" 
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="h-8"
            />
            <Select value={newColType} onValueChange={(v: any) => setNewColType(v)}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="w-3 h-3" /> {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full" onClick={handleAdd} disabled={!newColName}>
              Create
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
