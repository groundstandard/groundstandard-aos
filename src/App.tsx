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
import { MobileAppInstallPrompt } from "@/components/mobile/MobileAppInstallPrompt";
import { MobileEnhancements } from "@/components/mobile/MobileEnhancements";
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
import PaymentLog from "./pages/PaymentLog";
import Events from "./pages/Events";
import Subscription from "./pages/Subscription";
import Contacts from "./pages/Contacts";
import ContactTable from "./pages/ContactTable";
import ContactProfile from "./pages/ContactProfile";
import Automations from "./pages/Automations";
import CustomFields from "./pages/CustomFields";
import Configurations from "./pages/Configurations";
import PerformanceTargets from "./pages/PerformanceTargets";
import Settings from "./pages/Settings";
import AcademySetup from "./pages/AcademySetup";
import AcademySetupPage from "./pages/AcademySetupPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AcceptInvitation from "./pages/AcceptInvitation";
import TeamManagement from "./pages/TeamManagement";
import MembershipManagement from "./pages/MembershipManagement";
import ClassManagementPage from "./pages/ClassManagementPage";
import PaymentTestDashboard from "./pages/PaymentTestDashboard";
import StudentAttendanceHistoryPage from "./pages/StudentAttendanceHistory";
import BusinessSettings from "./pages/BusinessSettings";
import StudentBilling from "./pages/StudentBilling";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Communications from "./pages/Communications";
import AuditLogs from "./pages/AuditLogs";
import AdminBeltTests from "./pages/AdminBeltTests";

import { RoleSwitcher } from "@/components/admin/RoleSwitcher";
import { useRoleTesting } from "@/contexts/RoleTestingContext";
import AcademyGatekeeper from "@/components/academy/AcademyGatekeeper";
import ResponsiveLayout from "@/components/mobile/ResponsiveLayout";
import { AuthFlowHandler } from "@/components/auth/AuthFlowHandler";

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const { testRole, setTestRole } = useRoleTesting();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <ResponsiveLayout>
      <AuthFlowHandler />
      <Routes>
        <Route path="/" element={user ? <AcademyGatekeeper><Dashboard /></AcademyGatekeeper> : <Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={user ? <AcademyGatekeeper><Dashboard /></AcademyGatekeeper> : <Auth />} />
        <Route path="/classes" element={user ? <AcademyGatekeeper><Classes /></AcademyGatekeeper> : <Auth />} />
        <Route path="/attendance" element={user ? <AcademyGatekeeper><Attendance /></AcademyGatekeeper> : <Auth />} />
        <Route path="/student-attendance" element={user ? <AcademyGatekeeper><StudentAttendanceHistoryPage /></AcademyGatekeeper> : <Auth />} />
        <Route path="/checkin" element={user ? <AcademyGatekeeper><CheckIn /></AcademyGatekeeper> : <Auth />} />
        <Route path="/admin" element={user ? <AcademyGatekeeper><Admin /></AcademyGatekeeper> : <Auth />} />
        <Route path="/progress" element={user ? <AcademyGatekeeper><Progress /></AcademyGatekeeper> : <Auth />} />
        <Route path="/profile" element={user ? <AcademyGatekeeper><Profile /></AcademyGatekeeper> : <Auth />} />
        <Route path="/chat" element={user ? <AcademyGatekeeper><Chat /></AcademyGatekeeper> : <Auth />} />
        <Route path="/reports" element={user ? <AcademyGatekeeper><Reports /></AcademyGatekeeper> : <Auth />} />
        <Route path="/belt-testing" element={user ? <AcademyGatekeeper><BeltTesting /></AcademyGatekeeper> : <Auth />} />
        <Route path="/payments" element={user ? <AcademyGatekeeper><Payments /></AcademyGatekeeper> : <Auth />} />
        <Route path="/payment-log" element={user ? <AcademyGatekeeper><PaymentLog /></AcademyGatekeeper> : <Auth />} />
        <Route path="/payment-test-dashboard" element={user ? <AcademyGatekeeper><PaymentTestDashboard /></AcademyGatekeeper> : <Auth />} />
        <Route path="/subscription" element={user ? <AcademyGatekeeper><SubscriptionPage /></AcademyGatekeeper> : <Auth />} />
        <Route path="/contacts" element={user ? <AcademyGatekeeper><Contacts /></AcademyGatekeeper> : <Auth />} />
        <Route path="/contacts/table" element={user ? <AcademyGatekeeper><ContactTable /></AcademyGatekeeper> : <Auth />} />
        <Route path="/contacts/:id" element={user ? <AcademyGatekeeper><ContactProfile /></AcademyGatekeeper> : <Auth />} />
        <Route path="/configurations" element={user ? <AcademyGatekeeper><Configurations /></AcademyGatekeeper> : <Auth />} />
        <Route path="/automations" element={user ? <AcademyGatekeeper><Automations /></AcademyGatekeeper> : <Auth />} />
        <Route path="/custom-fields" element={user ? <AcademyGatekeeper><CustomFields /></AcademyGatekeeper> : <Auth />} />
        <Route path="/audit-logs" element={user ? <AcademyGatekeeper><AuditLogs /></AcademyGatekeeper> : <Auth />} />
        <Route path="/admin/performance-targets" element={user ? <AcademyGatekeeper><PerformanceTargets /></AcademyGatekeeper> : <Auth />} />
        <Route path="/admin/belt-tests" element={user ? <AcademyGatekeeper><AdminBeltTests /></AcademyGatekeeper> : <Auth />} />
        <Route path="/settings" element={user ? <AcademyGatekeeper><Settings /></AcademyGatekeeper> : <Auth />} />
        <Route path="/academy-setup" element={user ? <AcademySetup /> : <Auth />} />
        <Route path="/setup" element={user ? <AcademySetupPage /> : <Auth />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/team" element={user ? <AcademyGatekeeper><TeamManagement /></AcademyGatekeeper> : <Auth />} />
        <Route path="/membership-management" element={user ? <AcademyGatekeeper><MembershipManagement /></AcademyGatekeeper> : <Auth />} />
        <Route path="/class-management" element={user ? <AcademyGatekeeper><ClassManagementPage /></AcademyGatekeeper> : <Auth />} />
        <Route path="/business-settings" element={user ? <AcademyGatekeeper><BusinessSettings /></AcademyGatekeeper> : <Auth />} />
        <Route path="/communications" element={user ? <AcademyGatekeeper><Communications /></AcademyGatekeeper> : <Auth />} />
        <Route path="/billing" element={user ? <AcademyGatekeeper><StudentBilling /></AcademyGatekeeper> : <Auth />} />
        <Route path="/events" element={user ? <AcademyGatekeeper><Events /></AcademyGatekeeper> : <Auth />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Mobile App Features */}
      <MobileEnhancements />
      <MobileAppInstallPrompt />
      
      {/* Role switcher ribbon for owners */}
      {user && <RoleSwitcher currentTestRole={testRole} onRoleChange={setTestRole} />}
    </ResponsiveLayout>
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
        <BrowserRouter>
          <AuthProvider>
            <AcademyProvider>
              <SubscriptionProvider>
                <MembershipSubscriptionProvider>
                  <ViewProvider>
                  <RoleTestingProvider>
                    <Toaster />
                    <Sonner />
                      <AppRoutes />
                  </RoleTestingProvider>
                </ViewProvider>
                </MembershipSubscriptionProvider>
              </SubscriptionProvider>
            </AcademyProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
