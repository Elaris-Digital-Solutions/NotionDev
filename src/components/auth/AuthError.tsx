import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface AuthErrorProps {
    message?: string;
}

export function AuthError({ message = "An authentication error occurred." }: AuthErrorProps) {
    const { signOut, refreshSession } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background p-4 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Authentication Error</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                {message}
            </p>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
                <Button onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload
                </Button>
            </div>
        </div>
    );
}
