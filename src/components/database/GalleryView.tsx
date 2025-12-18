import { StatusBadge, PriorityBadge } from "@/components/badges/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DatabaseRow, DatabaseProperty } from "@/hooks/useDatabase";
import { usePageMutations } from "@/hooks/usePageMutations";
import { Link } from "react-router-dom";

interface GalleryViewProps {
  rows: DatabaseRow[];
  properties: DatabaseProperty[];
  pageId: string;
}

export function GalleryView({ rows, properties, pageId }: GalleryViewProps) {
  const { createChildPage } = usePageMutations(pageId);

  return (
    <div className="flex-1 overflow-auto px-8 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rows.map((row) => (
          <Link to={`/page/${row.id}`} key={row.id}>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden group h-full">
              <div className="h-32 bg-muted w-full object-cover flex items-center justify-center text-muted-foreground">
                {row?.cover_image ? (
                  <img src={row.cover_image} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{row?.icon || '📄'}</span>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium leading-none">{row.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {properties.slice(0, 3).map(prop => {
                    const val = row.properties[prop.name];
                    if (!val) return null;
                    return (
                      <div key={prop.id} className="text-xs text-muted-foreground border border-border rounded px-1">
                        {String(val)}
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Created {new Date(row.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        <button
          onClick={() => createChildPage.mutate('Untitled')}
          className="h-[300px] border border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent/50 transition-colors"
        >
          + New
        </button>
      </div>
    </div>
  );
}
