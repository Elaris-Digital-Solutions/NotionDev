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
import { toast } from "sonner";
import { ReauthModal } from "./ReauthModal";

interface ChangePasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const { updatePassword } = useAuth();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showReauth, setShowReauth] = useState(false);

    const handleStartChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        // Trigger re-auth first
        setShowReauth(true);
    };

    const handleReauthSuccess = async () => {
        setShowReauth(false); // Close reauth modal
        setLoading(true); // Show loading on main modal

        try {
            await updatePassword(newPassword);
            setNewPassword("");
            setConfirmPassword("");
            onOpenChange(false);
            // Success toast is handled in provider, but we can add more specific context here if needed
        } catch (err: any) {
            console.error("Password update failed:", err);
            toast.error(err.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for your account. You will be asked to confirm your current password.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleStartChange} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password"
                                disabled={loading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                disabled={loading}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!newPassword || !confirmPassword || loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ReauthModal
                open={showReauth}
                onOpenChange={setShowReauth}
                onSuccess={handleReauthSuccess}
            />
        </>
    );
}
