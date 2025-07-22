import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ViewProvider } from "@/hooks/useView";
import { RoleTestingProvider } from "@/contexts/RoleTestingContext";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { MembershipSubscriptionProvider } from "@/hooks/useMembershipSubscription";
import { AcademyProvider } from "@/hooks/useAcademy";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import CheckIn from "./pages/CheckIn";
import Admin from "./pages/Admin";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Reports from "./pages/Reports";
import BeltTesting from "./pages/BeltTesting";
import Payments from "./pages/Payments";
import Events from "./pages/Events";
import Subscription from "./pages/Subscription";
import Contacts from "./pages/Contacts";
import ContactTable from "./pages/ContactTable";
import ContactProfile from "./pages/ContactProfile";
import Automations from "./pages/Automations";
import PerformanceTargets from "./pages/PerformanceTargets";
import Settings from "./pages/Settings";
import AcademySetup from "./pages/AcademySetup";
import AcademySetupPage from "./pages/AcademySetupPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AcceptInvitation from "./pages/AcceptInvitation";
import TeamManagement from "./pages/TeamManagement";
import MembershipManagement from "./pages/MembershipManagement";
import ClassManagementPage from "./pages/ClassManagementPage";
import NotFound from "./pages/NotFound";

import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { useRoleTesting } from "@/contexts/RoleTestingContext";
import AcademyGatekeeper from "@/components/academy/AcademyGatekeeper";

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { testRole, setTestRole } = useRoleTesting();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={user ? <AcademyGatekeeper><Dashboard /></AcademyGatekeeper> : <Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={user ? <AcademyGatekeeper><Dashboard /></AcademyGatekeeper> : <Auth />} />
        <Route path="/classes" element={user ? <AcademyGatekeeper><Classes /></AcademyGatekeeper> : <Auth />} />
        <Route path="/attendance" element={user ? <AcademyGatekeeper><Attendance /></AcademyGatekeeper> : <Auth />} />
        <Route path="/checkin" element={user ? <AcademyGatekeeper><CheckIn /></AcademyGatekeeper> : <Auth />} />
        <Route path="/admin" element={user ? <AcademyGatekeeper><Admin /></AcademyGatekeeper> : <Auth />} />
        <Route path="/progress" element={user ? <AcademyGatekeeper><Progress /></AcademyGatekeeper> : <Auth />} />
        <Route path="/profile" element={user ? <AcademyGatekeeper><Profile /></AcademyGatekeeper> : <Auth />} />
        <Route path="/chat" element={user ? <AcademyGatekeeper><Chat /></AcademyGatekeeper> : <Auth />} />
        <Route path="/reports" element={user ? <AcademyGatekeeper><Reports /></AcademyGatekeeper> : <Auth />} />
        <Route path="/belt-testing" element={user ? <AcademyGatekeeper><BeltTesting /></AcademyGatekeeper> : <Auth />} />
        <Route path="/payments" element={user ? <AcademyGatekeeper><Payments /></AcademyGatekeeper> : <Auth />} />
        <Route path="/subscription" element={user ? <AcademyGatekeeper><SubscriptionPage /></AcademyGatekeeper> : <Auth />} />
        <Route path="/contacts" element={user ? <AcademyGatekeeper><Contacts /></AcademyGatekeeper> : <Auth />} />
        <Route path="/contacts/table" element={user ? <AcademyGatekeeper><ContactTable /></AcademyGatekeeper> : <Auth />} />
        <Route path="/contacts/:id" element={user ? <AcademyGatekeeper><ContactProfile /></AcademyGatekeeper> : <Auth />} />
        <Route path="/automations" element={user ? <AcademyGatekeeper><Automations /></AcademyGatekeeper> : <Auth />} />
        <Route path="/admin/performance-targets" element={user ? <AcademyGatekeeper><PerformanceTargets /></AcademyGatekeeper> : <Auth />} />
        <Route path="/settings" element={user ? <AcademyGatekeeper><Settings /></AcademyGatekeeper> : <Auth />} />
        <Route path="/academy-setup" element={user ? <AcademySetup /> : <Auth />} />
        <Route path="/setup" element={user ? <AcademySetupPage /> : <Auth />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/team" element={user ? <AcademyGatekeeper><TeamManagement /></AcademyGatekeeper> : <Auth />} />
        <Route path="/membership-management" element={user ? <AcademyGatekeeper><MembershipManagement /></AcademyGatekeeper> : <Auth />} />
        <Route path="/class-management" element={user ? <AcademyGatekeeper><ClassManagementPage /></AcademyGatekeeper> : <Auth />} />
        <Route path="/events" element={user ? <AcademyGatekeeper><Events /></AcademyGatekeeper> : <Auth />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Role switcher ribbon for owners */}
      {user && <RoleSwitcher currentTestRole={testRole} onRoleChange={setTestRole} />}
    </>
  );
};

// Create QueryClient outside of component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AcademyProvider>
            <SubscriptionProvider>
              <MembershipSubscriptionProvider>
                <ViewProvider>
                <RoleTestingProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <AppRoutes />
                  </BrowserRouter>
                </RoleTestingProvider>
              </ViewProvider>
              </MembershipSubscriptionProvider>
            </SubscriptionProvider>
          </AcademyProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
