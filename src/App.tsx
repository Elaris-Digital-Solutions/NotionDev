import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider } from "./components/providers/AuthProvider";
import { AuthLayout } from "./components/layout/AuthLayout";
import { ProtectedLayout } from "./components/layout/ProtectedLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes - Only accessible when NOT logged in */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Routes - Only accessible when logged in */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/inbox" element={<Index view="inbox" />} />
              <Route path="/meetings" element={<Index view="meetings" />} />
              <Route path="/page/:pageId" element={<Index view="page" />} />
              <Route path="/teamspace/:teamSpaceId" element={<Index view="teamspace" />} />
              <Route path="/private" element={<Index view="private" />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
