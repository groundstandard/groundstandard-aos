import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as SelectComponents from "@/components/ui/select";

const Select = SelectComponents.Select;
const SelectContent = SelectComponents.SelectContent;
const SelectItem = SelectComponents.SelectItem;
const SelectTrigger = SelectComponents.SelectTrigger;
const SelectValue = SelectComponents.SelectValue;
import { 
  LogOut, User, Calendar, CreditCard, BarChart3, CheckCircle, MessageCircle, 
  FileText, Award, DollarSign, Users, TrendingUp, Settings, Crown, Star,
  Clock, Target, Activity, Bell, CalendarDays, UserCheck, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ProfileView } from "@/components/profile/ProfileView";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import MultiAcademySwitcher from "@/components/academy/MultiAcademySwitcher";
import { useAcademy } from "@/hooks/useAcademy";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useEffectiveRole();
  const { academy, currentAcademyId } = useAcademy();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  const handleRefreshStats = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      toast({
        title: "Success",
        description: "Dashboard statistics refreshed",
      });
    }, 1000);
  };

  const quickStats = [
    {
      title: "Total Students",
      value: "0", // Will be replaced with academy-specific data
      change: "No data",
      trend: "neutral",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Classes",
      value: "0", // Will be replaced with academy-specific data
      change: "No data", 
      trend: "neutral",
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: "$0", // Will be replaced with academy-specific data
      change: "No data",
      trend: "neutral", 
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Attendance Rate",
      value: "0%", // Will be replaced with academy-specific data
      change: "No data",
      trend: "neutral",
      icon: TrendingUp,
      color: "text-orange-600"
    },
    {
      title: "Belt Tests",
      value: "0", // Will be replaced with academy-specific data
      change: "No data",
      trend: "neutral",
      icon: Award,
      color: "text-yellow-600"
    },
    {
      title: "Active Subscriptions", 
      value: "0", // Will be replaced with academy-specific data
      change: "No data",
      trend: "neutral",
      icon: Crown,
      color: "text-indigo-600"
    }
  ];

  

  // Show Admin Dashboard for admin users
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          {/* Main Header - Admin Dashboard Title with Academy Switcher */}
          <div className="flex justify-between items-center mb-6">
            {/* Left side - Academy Switcher and Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Show academy switcher for all admin/owner roles */}
              <MultiAcademySwitcher />
              <div className="flex items-center gap-2 sm:gap-3">
                <BarChart3 className="h-5 w-5 sm:h-6 md:h-8 text-primary" />
                <div>
                  <h1 className="text-lg sm:text-xl md:text-4xl font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-xs sm:text-sm md:text-lg text-muted-foreground hidden sm:block">
                    Complete management and analytics for {academy?.name || 'your martial arts academy'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Check-In, Chat and Settings buttons */}
            {/* Desktop/Tablet Layout */}
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => navigate('/checkin')}
              >
                <Clock className="h-4 w-4" />
                Check-In
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </Button>
            </div>

            {/* Mobile Layout - Stacked Check-In, Chat and Settings */}
            <div className="flex sm:hidden flex-col gap-1">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-8"
                onClick={() => navigate('/checkin')}
              >
                <Clock className="h-3 w-3" />
                <span className="text-xs">Check-In</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1 h-8"
                onClick={() => navigate('/chat')}
              >
                <MessageCircle className="h-3 w-3" />
                <span className="text-xs">Chat</span>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-4 border-b border-border pb-4 overflow-x-auto">
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${selectedTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'} pb-2`}
                onClick={() => setSelectedTab('overview')}
              >
                <TrendingUp className="h-4 w-4" />
                Overview
              </Button>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${selectedTab === 'contacts' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'} pb-2`}
                onClick={() => {
                  setSelectedTab('contacts');
                  navigate('/contacts');
                }}
              >
                <Users className="h-4 w-4" />
                Contacts
              </Button>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${selectedTab === 'payments' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'} pb-2`}
                onClick={() => {
                  setSelectedTab('payments');
                  navigate('/payments');
                }}
              >
                <DollarSign className="h-4 w-4" />
                Payments
              </Button>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${selectedTab === 'attendance' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'} pb-2`}
                onClick={() => {
                  setSelectedTab('attendance');
                  navigate('/attendance');
                }}
              >
                <CheckCircle className="h-4 w-4" />
                Attendance
              </Button>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${selectedTab === 'reporting' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'} pb-2`}
                onClick={() => {
                  setSelectedTab('reporting');
                  navigate('/reports');
                }}
              >
                <BarChart3 className="h-4 w-4" />
                Reporting
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 whitespace-nowrap hover:text-primary pb-2"
                onClick={() => navigate('/automations')}
              >
                <Activity className="h-4 w-4" />
                Automations
              </Button>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 whitespace-nowrap hover:text-primary pb-2"
                onClick={() => navigate('/profile')}
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
              <Button 
                variant="ghost" 
                className={`flex items-center gap-2 whitespace-nowrap ${selectedTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'} pb-2`}
                onClick={() => setSelectedTab('settings')}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>

            {/* Secondary Navigation Ribbons */}
            {selectedTab === 'payments' && (
              <div className="flex items-center gap-4 border-b border-border pb-4 mt-4 overflow-x-auto">
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/payments')}>
                  <DollarSign className="h-4 w-4" />
                  Payment Portal
                </Button>
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/membership-management')}>
                  <Crown className="h-4 w-4" />
                  Memberships
                </Button>
              </div>
            )}

            {selectedTab === 'attendance' && (
              <div className="flex items-center gap-4 border-b border-border pb-4 mt-4 overflow-x-auto">
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/attendance')}>
                  <CheckCircle className="h-4 w-4" />
                  Attendance Tracking
                </Button>
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/class-management')}>
                  <Calendar className="h-4 w-4" />
                  Classes
                </Button>
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/events')}>
                  <CalendarDays className="h-4 w-4" />
                  Events
                </Button>
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/belt-testing')}>
                  <Star className="h-4 w-4" />
                  Promotions
                </Button>
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/checkin')}>
                  <Clock className="h-4 w-4" />
                  Check-In
                </Button>
              </div>
            )}

            {selectedTab === 'settings' && (
              <div className="flex items-center gap-4 border-b border-border pb-4 mt-4 overflow-x-auto">
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/automations')}>
                  <Activity className="h-4 w-4" />
                  Automations
                </Button>
                <Button variant="ghost" className="flex items-center gap-2 hover:text-primary whitespace-nowrap" onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </div>
            )}
          </div>

          {/* Only show overview content when overview tab is selected */}
          {selectedTab === 'overview' && (
            <>
              {/* Quick Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {quickStats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <Card key={index} className="hover:shadow-lg transition-shadow h-32 flex flex-col relative">
                      <CardHeader className="pb-2 px-4 pt-4 min-h-[44px] pr-12">
                        <CardTitle className="text-sm font-medium text-muted-foreground leading-tight">
                          {stat.title}
                        </CardTitle>
                        <IconComponent className={`h-5 w-5 ${stat.color} absolute top-4 right-4`} />
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col justify-end px-4 pb-4 pt-0">
                        <div className="text-2xl font-bold text-black mb-1">{stat.value}</div>
                        <div className="h-[20px] flex items-end">
                          <p className={`text-xs leading-none ${
                            stat.trend === 'up' ? 'text-green-600' : 
                            stat.trend === 'down' ? 'text-red-600' : 
                            'text-muted-foreground'
                          }`}>
                            {stat.change} from last month
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Performance Overview - 3 Separate Cards */}
              <div className="grid gap-6 mb-6 md:grid-cols-3">
                {/* Student Retention Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Student Retention
                      </CardTitle>
                      <Select defaultValue="3months">
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3months">3 Months</SelectItem>
                          <SelectItem value="6months">6 Months</SelectItem>
                          <SelectItem value="9months">9 Months</SelectItem>
                          <SelectItem value="12months">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">96%</div>
                        <div className="text-sm text-muted-foreground">of target (90%)</div>
                      </div>
                      <Progress value={96} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Class Capacity Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4" />
                        Class Capacity
                      </CardTitle>
                      <Select defaultValue="adults">
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adults">Adults</SelectItem>
                          <SelectItem value="youth">Youth</SelectItem>
                          <SelectItem value="first30">First 30 Days</SelectItem>
                          <SelectItem value="after30">After 30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">78%</div>
                        <div className="text-sm text-muted-foreground">of target (80%)</div>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Goal Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <DollarSign className="h-4 w-4" />
                        Revenue Goal
                      </CardTitle>
                      <Select defaultValue="monthly">
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarter</SelectItem>
                          <SelectItem value="halfyear">Half Year</SelectItem>
                          <SelectItem value="yearly">Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">84%</div>
                        <div className="text-sm text-muted-foreground">of target ($20,000)</div>
                      </div>
                      <Progress value={84} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest updates from your academy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        action: "New student enrollment",
                        details: "Sarah Johnson joined Advanced Karate",
                        time: "2 minutes ago",
                        type: "enrollment"
                      },
                      {
                        action: "Payment received",
                        details: "$150 monthly subscription from Mike Chen",
                        time: "15 minutes ago", 
                        type: "payment"
                      },
                      {
                        action: "Belt test scheduled",
                        details: "3 students registered for Black Belt test",
                        time: "1 hour ago",
                        type: "test"
                      },
                      {
                        action: "Class completed",
                        details: "Evening Judo session with 18 participants",
                        time: "2 hours ago",
                        type: "class"
                      }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{activity.details}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        

          {/* View Toggle at bottom center */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
            <ViewToggle />
          </div>
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
            {/* Students don't get academy switcher */}
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