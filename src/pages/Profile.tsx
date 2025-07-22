import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { ProfileView } from "@/components/profile/ProfileView";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, Building2, Settings } from "lucide-react";

const Profile = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        </div>
        
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="academy" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Academy
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <ProfileView section="personal" />
          </TabsContent>
          
          <TabsContent value="subscription">
            <ProfileView section="subscription" />
          </TabsContent>
          
          <TabsContent value="academy">
            <ProfileView section="academy" />
          </TabsContent>
          
          <TabsContent value="account">
            <ProfileView section="account" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;