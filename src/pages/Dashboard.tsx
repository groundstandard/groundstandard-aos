import { useAuth } from "@/hooks/useAuth";
import { useView } from "@/hooks/useView";
import { useIsMobile } from "@/hooks/use-mobile";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  LogOut, User, Calendar, CreditCard, BarChart3, CheckCircle, MessageCircle, 
  FileText, Award, DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ProfileView } from "@/components/profile/ProfileView";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { currentView } = useView();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  const isAdmin = profile?.role === 'admin' && currentView === 'admin';

  // Show Admin Dashboard for admin users
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Header with View Toggle and Profile */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex-1"></div>
            <ViewToggle />
            <div className="flex-1 flex justify-end">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Profile Management</DialogTitle>
                  </DialogHeader>
                  <ProfileView />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick Navigation Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
              <CardDescription>Access key admin functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                  onClick={() => navigate('/classes')}
                >
                  <Calendar className="h-4 w-4" />
                  Classes
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                  onClick={() => navigate('/chat')}
                >
                  <MessageCircle className="h-4 w-4" />
                  Academy Chat
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                  onClick={() => navigate('/payments')}
                >
                  <CreditCard className="h-4 w-4" />
                  Payments
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                  onClick={() => navigate('/reports')}
                >
                  <FileText className="h-4 w-4" />
                  Reports
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                  onClick={() => navigate('/belt-testing')}
                >
                  <Award className="h-4 w-4" />
                  Belt Testing
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                  onClick={() => navigate('/events')}
                >
                  <Calendar className="h-4 w-4" />
                  Events
                </Button>
              </div>
            </CardContent>
          </Card>

          <AdminDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header with View Toggle, Welcome, and Profile */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex-1">
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-display font-bold text-primary`}>
              Welcome, {profile.first_name}
            </h1>
            <div className={`flex items-center gap-2 mt-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <Badge variant="secondary" className={isMobile ? "text-xs" : ""}>
                Member
              </Badge>
              <Badge variant="outline" className={isMobile ? "text-xs" : ""}>{profile.membership_status}</Badge>
              {profile.belt_level && (
                <Badge variant="secondary" className={isMobile ? "text-xs" : ""}>{profile.belt_level}</Badge>
              )}
            </div>
          </div>
          <ViewToggle />
          <div className="flex-1 flex justify-end gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Profile Management</DialogTitle>
                </DialogHeader>
                <ProfileView />
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              onClick={signOut}
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Navigation Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
            <CardDescription>Navigate to key member features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                onClick={() => navigate('/classes')}
              >
                <Calendar className="h-4 w-4" />
                Classes
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                onClick={() => navigate('/attendance')}
              >
                <CheckCircle className="h-4 w-4" />
                Attendance
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                onClick={() => navigate('/progress')}
              >
                <BarChart3 className="h-4 w-4" />
                Progress
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex flex-col items-center justify-center text-xs gap-1"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="h-4 w-4" />
                Academy Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Member Features Grid */}
        <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/classes')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Classes
              </CardTitle>
              <CardDescription>View and book classes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/classes'); }}>
                View Classes
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/attendance')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Attendance
              </CardTitle>
              <CardDescription>Track your class attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/attendance'); }}>
                View Attendance
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/progress')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                My Progress
              </CardTitle>
              <CardDescription>Track your martial arts journey</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/progress'); }}>
                View Progress
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/chat')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Academy Chat
              </CardTitle>
              <CardDescription>Connect with members and instructors</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/chat'); }}>
                Open Chat
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/payments')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payments
              </CardTitle>
              <CardDescription>View payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/payments'); }}>
                Payment History
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/subscription')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/subscription'); }}>
                View Plans
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;