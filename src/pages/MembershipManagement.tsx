import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { MembershipManagement } from "@/components/admin/MembershipManagement";
import { BeltProgressionDashboard } from "@/components/belt/BeltProgressionDashboard";
import { BeltRequirements } from "@/components/belt/BeltRequirements";
import { StudentBeltHistory } from "@/components/belt/StudentBeltHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigate } from "react-router-dom";
import { Crown, Award, Settings, History } from "lucide-react";

const MembershipManagementPage = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState("memberships");

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Only allow admin and owner access
  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
          <p className="text-muted-foreground">
            This page is for academy administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Membership & Belt Management</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage membership plans, belt progressions, and student advancement
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="memberships" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Memberships</span>
            </TabsTrigger>
            <TabsTrigger value="belt-progression" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Belt Progress</span>
            </TabsTrigger>
            <TabsTrigger value="belt-requirements" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Requirements</span>
            </TabsTrigger>
            <TabsTrigger value="belt-history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memberships" className="space-y-6">
            <MembershipManagement />
          </TabsContent>

          <TabsContent value="belt-progression" className="space-y-6">
            <BeltProgressionDashboard />
          </TabsContent>

          <TabsContent value="belt-requirements" className="space-y-6">
            <BeltRequirements />
          </TabsContent>

          <TabsContent value="belt-history" className="space-y-6">
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Student Belt History</h3>
              <p className="text-muted-foreground mb-4">
                Select a student from the Belt Progress tab to view their detailed history
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MembershipManagementPage;