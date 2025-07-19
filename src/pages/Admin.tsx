import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/BackButton";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { ClassManagement } from "@/components/admin/ClassManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { SecurityAudit } from "@/components/admin/SecurityAudit";
import { SubscriptionManagement } from "@/components/admin/SubscriptionManagement";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { CommunicationCenter } from "@/components/admin/CommunicationCenter";
import { EventManagement } from "@/components/admin/EventManagement";
import { InventoryManagement } from "@/components/admin/InventoryManagement";
import { PaymentManagement } from "@/components/admin/PaymentManagement";
import { InvoiceManagement } from "@/components/admin/InvoiceManagement";
import { AdvancedAttendance } from "@/components/admin/AdvancedAttendance";
import { BeltTestManagement } from "@/components/admin/BeltTestManagement";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { StockMovementHistory } from "@/components/admin/StockMovementHistory";
import { ContactManagement } from "@/components/admin/ContactManagement";
import {
  Settings, 
  Users, 
  Calendar, 
  BarChart3, 
  Shield, 
  CreditCard,
  Home,
  DollarSign,
  MessageSquare,
  Package,
  Bell,
  FileText,
  CheckCircle
} from "lucide-react";

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  type CategoryConfig = {
    label: string;
    icon: any;
    component?: JSX.Element;
    subTabs?: Record<string, { label: string; component: JSX.Element }>;
  };

  const categories: Record<string, CategoryConfig> = {
    dashboard: {
      label: "Dashboard",
      icon: Home,
      component: <AdminDashboard />
    },
    core: {
      label: "Core Management", 
      icon: Users,
      subTabs: {
        users: { label: "Users", component: <UserManagement /> },
        contacts: { label: "Contacts", component: <ContactManagement /> },
        classes: { label: "Classes", component: <ClassManagement /> },
        attendance: { label: "Attendance", component: <AdvancedAttendance /> },
        belt_tests: { label: "Belt Tests", component: <BeltTestManagement /> }
      }
    },
    business: {
      label: "Business Operations",
      icon: DollarSign, 
      subTabs: {
        payments: { label: "Payments", component: <PaymentManagement /> },
        invoices: { label: "Invoices", component: <InvoiceManagement /> },
        subscriptions: { label: "Subscriptions", component: <SubscriptionManagement /> },
        events: { label: "Events", component: <EventManagement /> }
      }
    },
    system: {
      label: "System Management",
      icon: Settings,
      subTabs: {
        inventory: { label: "Inventory", component: <InventoryManagement /> },
        stock_history: { label: "Stock History", component: <StockMovementHistory /> },
        communication: { label: "Communication", component: <CommunicationCenter /> },
        analytics: { label: "Analytics", component: <AdminAnalytics /> },
        security: { label: "Security", component: <SecurityAudit /> },
        audit_logs: { label: "Audit Logs", component: <AuditLogViewer /> }
      }
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const categoryConfig = categories[category];
    if (categoryConfig?.subTabs) {
      const firstSubTab = Object.keys(categoryConfig.subTabs)[0];
      setActiveSubTab(firstSubTab);
    } else {
      setActiveSubTab("");
    }
  };

  const renderContent = () => {
    const category = categories[activeCategory];
    if (category?.component) {
      return category.component;
    }
    if (category?.subTabs && activeSubTab) {
      return category.subTabs[activeSubTab]?.component;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your martial arts academy
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Category Navigation */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(categories).map(([key, category]) => {
                  const IconComponent = category.icon;
                  return (
                    <Button
                      key={key}
                      variant={activeCategory === key ? "default" : "outline"}
                      className="h-20 flex flex-col gap-2 text-center"
                      onClick={() => handleCategoryChange(key)}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-sm font-medium">{category.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sub-category Navigation */}
          {categories[activeCategory]?.subTabs && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categories[activeCategory]?.subTabs || {}).map(([key, subTab]) => (
                    <Button
                      key={key}
                      variant={activeSubTab === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveSubTab(key)}
                      className="min-w-24"
                    >
                      {subTab.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Area */}
          <div className="min-h-[600px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;