import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface SearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    useEffect(() => {
        const searchPages = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('pages')
                    .select('id, title, icon, type')
                    .ilike('title', `%${query}%`)
                    .limit(10);

                if (error) throw error;
                setResults(data || []);
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchPages, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (pageId: string) => {
        navigate(`/page/${pageId}`);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search pages..."
                            className="border-none shadow-none focus-visible:ring-0 h-auto p-0 text-base"
                            autoFocus
                        />
                    </div>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-4 text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((page) => (
                                <button
                                    key={page.id}
                                    onClick={() => handleSelect(page.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm text-left transition-colors"
                                >
                                    <span className="flex items-center justify-center w-6 h-6 rounded bg-muted">
                                        {page.icon || <FileText className="w-3 h-3 text-muted-foreground" />}
                                    </span>
                                    <div className="flex-1 truncate">
                                        <div className="font-medium text-foreground">{page.title}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{page.type}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.trim() ? (
                        <div className="text-center p-8 text-muted-foreground text-sm">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="text-center p-8 text-muted-foreground text-sm">
                            Type to search...
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
