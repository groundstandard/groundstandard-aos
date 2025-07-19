import { useAuth } from "@/hooks/useAuth";
import { useView } from "@/hooks/useView";
import { useIsMobile } from "@/hooks/use-mobile";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, User, Calendar, CreditCard, BarChart3, CheckCircle, MessageCircle, 
  FileText, Award, DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

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
          {/* View Toggle for Admins */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <ViewToggle />
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
        {/* View Toggle for Admins */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <ViewToggle />
        </div>

        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between items-center'} mb-6 sm:mb-8`}>
          <div className="flex-1">
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-display font-bold text-primary`}>
              Welcome, {profile.first_name}
            </h1>
            <div className={`flex items-center gap-2 mt-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <Badge variant={isAdmin ? "default" : "secondary"} className={isMobile ? "text-xs" : ""}>
                {currentView === 'admin' ? 'Admin' : 'Member'}
              </Badge>
              <Badge variant="outline" className={isMobile ? "text-xs" : ""}>{profile.membership_status}</Badge>
              {profile.belt_level && (
                <Badge variant="secondary" className={isMobile ? "text-xs" : ""}>{profile.belt_level}</Badge>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={signOut}
            size={isMobile ? "sm" : "default"}
            className={isMobile ? "self-end" : ""}
          >
            <LogOut className={`${isMobile ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'}`} />
            {isMobile ? "Sign Out" : "Sign Out"}
          </Button>
        </div>

        <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          <Card className="card-minimal hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/profile')}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="card-minimal hover-lift cursor-pointer"
            onClick={() => navigate('/classes')}
          >
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
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/classes'); }}>
                {isAdmin ? "Manage Classes" : "View Classes"}
              </Button>
            </CardContent>
          </Card>

          {!isAdmin && (
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
          )}

          {!isAdmin && (
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
          )}

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
              <CardDescription>
                {isAdmin ? "Process payments" : "View payment history"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/payments'); }}>
                {isAdmin ? "Process Payments" : "Payment History"}
              </Button>
            </CardContent>
          </Card>

          {!isAdmin && (
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
          )}

          {isAdmin && (
            <>
              <Card 
                className="card-minimal hover-lift cursor-pointer"
                onClick={() => navigate('/reports')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Reports
                  </CardTitle>
                  <CardDescription>Comprehensive analytics & insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/reports'); }}>
                    View Reports
                  </Button>
                </CardContent>
              </Card>

              <Card 
                className="card-minimal hover-lift cursor-pointer"
                onClick={() => navigate('/admin')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Admin Dashboard
                  </CardTitle>
                  <CardDescription>Security & user management</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/admin'); }}>
                    Admin Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/belt-testing')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Belt Testing
                  </CardTitle>
                  <CardDescription>
                    Manage student belt promotions and testing schedules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/belt-testing'); }}>
                    Manage Belt Tests
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/events')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Events
                  </CardTitle>
                  <CardDescription>
                    Academy events, competitions, and special activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate('/events'); }}>
                    Manage Events
                  </Button>
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