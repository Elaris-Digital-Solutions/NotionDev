import { useAuth } from "@/components/providers/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const ProtectedLayout = () => {
    const { user, state } = useAuth();
    const location = useLocation();

    if (state === 'LOADING' || state === 'IDLE') {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login page, but save the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
