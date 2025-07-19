import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Admin from "./pages/Admin";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Dashboard /> : <Index />} />
      <Route path="/auth" element={!user ? <Auth /> : <Dashboard />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Auth />} />
      <Route path="/classes" element={user ? <Classes /> : <Auth />} />
      <Route path="/attendance" element={user ? <Attendance /> : <Auth />} />
      <Route path="/admin" element={user ? <Admin /> : <Auth />} />
      <Route path="/progress" element={user ? <Progress /> : <Auth />} />
      <Route path="/profile" element={user ? <Profile /> : <Auth />} />
      <Route path="/chat" element={user ? <Chat /> : <Auth />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
