import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/BackButton";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserManagement } from "@/components/admin/UserManagement";
import { ClassManagement } from "@/components/admin/ClassManagement";
import { SecurityAudit } from "@/components/admin/SecurityAudit";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { SubscriptionManagement } from "@/components/admin/SubscriptionManagement";
import { 
  Users, 
  Calendar, 
  Shield, 
  BarChart3,
  Settings,
  Bell,
  FileText,
  Database,
  DollarSign
} from "lucide-react";

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("analytics");

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

  return (
    <div className="min-h-screen bg-gradient-subtle overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-full">
        <BackButton />
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
          <div className="min-w-0 flex-1">
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-foreground truncate`}>
              Admin Dashboard
            </h1>
            <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''} mt-1`}>
              Manage your martial arts academy
            </p>
          </div>
          
          {!isMobile && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 w-full">
          {isMobile ? (
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-background/50 backdrop-blur p-1 text-muted-foreground w-max min-w-full">
                <TabsTrigger value="analytics" className="flex items-center gap-1 px-2 py-1.5 text-xs whitespace-nowrap">
                  <BarChart3 className="h-3 w-3" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-1 px-2 py-1.5 text-xs whitespace-nowrap">
                  <Users className="h-3 w-3" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="classes" className="flex items-center gap-1 px-2 py-1.5 text-xs whitespace-nowrap">
                  <Calendar className="h-3 w-3" />
                  Classes
                </TabsTrigger>
                <TabsTrigger value="subscriptions" className="flex items-center gap-1 px-2 py-1.5 text-xs whitespace-nowrap">
                  <DollarSign className="h-3 w-3" />
                  Plans
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-1 px-2 py-1.5 text-xs whitespace-nowrap">
                  <Shield className="h-3 w-3" />
                  Security
                </TabsTrigger>
              </TabsList>
            </div>
          ) : (
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Classes
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="analytics" className="space-y-6">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <ClassManagement />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecurityAudit />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;