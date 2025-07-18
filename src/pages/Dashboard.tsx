import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Calendar, CreditCard, BarChart3 } from "lucide-react";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  const isAdmin = profile.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary">
              Welcome, {profile.first_name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
              <Badge variant="outline">{profile.membership_status}</Badge>
              {profile.belt_level && (
                <Badge variant="secondary">{profile.belt_level}</Badge>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Profile</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Classes
              </CardTitle>
              <CardDescription>
                {isAdmin ? "Manage class schedules" : "View and book classes"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {isAdmin ? "Manage Classes" : "View Classes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payments
              </CardTitle>
              <CardDescription>
                {isAdmin ? "Process payments" : "View payment history"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {isAdmin ? "Process Payments" : "Payment History"}
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <>
              <Card className="hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Reports
                  </CardTitle>
                  <CardDescription>View academy analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Reports</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Management
                  </CardTitle>
                  <CardDescription>Manage student profiles</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Manage Students</Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;