import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import TeamManagement from "@/components/academy/TeamManagement";
import { Navigate } from "react-router-dom";
import { Users } from "lucide-react";

const TeamManagementPage = () => {
  const { user, profile } = useAuth();

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
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Team Management</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Invite and manage your academy team members
            </p>
          </div>
        </div>

        <TeamManagement />
      </div>
    </div>
  );
};

export default TeamManagementPage;