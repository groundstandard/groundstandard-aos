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
        {/* Header with reorganized layout */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/chat')}
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </div>
          
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-display font-bold text-primary`}>
              Welcome, {profile.first_name}!
            </h1>
            <div className={`flex items-center justify-center gap-2 mt-2 ${isMobile ? 'flex-wrap' : ''}`}>
              {profile.belt_level && (
                <Badge variant="secondary" className={isMobile ? "text-xs" : ""}>{profile.belt_level}</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={isMobile ? "text-xs" : ""}>
              Student Active
            </Badge>
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

        {/* Student Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Student Since</h3>
              <User className="h-3 w-3 text-blue-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-lg font-bold">
                {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
              </p>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Total Classes</h3>
              <BarChart3 className="h-3 w-3 text-green-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-lg font-bold">42</p>
              <p className="text-xs text-muted-foreground">+3 This month</p>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Current Belt</h3>
              <Award className="h-3 w-3 text-purple-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-lg font-bold">{profile.belt_level || 'White'}</p>
              <p className="text-xs text-muted-foreground">Next: Yellow</p>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Next Class</h3>
              <Calendar className="h-3 w-3 text-orange-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-lg font-bold">Today</p>
              <p className="text-xs text-muted-foreground">7:00 PM</p>
            </div>
          </Card>
        </div>

        {/* Student Features Grid */}
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/classes')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Classes
              </CardTitle>
              <CardDescription className="text-xs">View and book classes</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); navigate('/classes'); }}>
                View Classes
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/attendance')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                Attendance
              </CardTitle>
              <CardDescription className="text-xs">Track your class attendance</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); navigate('/attendance'); }}>
                View Attendance
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/progress')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                My Progress
              </CardTitle>
              <CardDescription className="text-xs">Track your martial arts journey</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); navigate('/progress'); }}>
                View Progress
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/payments')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                History
              </CardTitle>
              <CardDescription className="text-xs">View payment history</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); navigate('/payments'); }}>
                View History
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle at bottom center */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <ViewToggle />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;