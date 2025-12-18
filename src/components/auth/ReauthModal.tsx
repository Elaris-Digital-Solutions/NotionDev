import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/providers/AuthProvider";

interface ReauthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ReauthModal({ open, onOpenChange, onSuccess }: ReauthModalProps) {
    const { reauthenticate } = useAuth();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await reauthenticate(password);
            onSuccess();
            setPassword(""); // Clear for security
            if (!open) setPassword(""); // Double ensure cleanup
        } catch (err: any) {
            console.error("Reauth failed:", err);
            setError(err.message || "Failed to verify identity");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Authentication</DialogTitle>
                    <DialogDescription>
                        For your security, please enter your password to continue.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                            id="current-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    {error && (
                        <div className="text-sm font-medium text-destructive">
                            {error}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!password || loading}>
                            {loading ? "Verifying..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
