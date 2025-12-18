import { useAuth } from "@/components/providers/AuthProvider";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const AuthLayout = () => {
  const { user, state } = useAuth();
  const location = useLocation();

  if (state === 'LOADING' || state === 'IDLE') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is already logged in, redirect them away from auth pages
  if (user) {
    // Check if there was a saved destination in state (though unlikely for auth pages directly, good practice)
    // Default to dashboard
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
};
