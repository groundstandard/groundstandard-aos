import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ViewProvider } from "@/hooks/useView";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Admin from "./pages/Admin";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Reports from "./pages/Reports";
import BeltTesting from "./pages/BeltTesting";
import Payments from "./pages/Payments";
import Events from "./pages/Events";
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
      <Route path="/reports" element={user ? <Reports /> : <Auth />} />
      <Route path="/belt-testing" element={user ? <BeltTesting /> : <Auth />} />
      <Route path="/payments" element={user ? <Payments /> : <Auth />} />
      <Route path="/events" element={user ? <Events /> : <Auth />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ViewProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ViewProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
