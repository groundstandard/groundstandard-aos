import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useResponsive } from "@/hooks/use-responsive";
import TouchOptimized from "@/components/mobile/TouchOptimized";
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
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ProfileView } from "@/components/profile/ProfileView";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import MultiAcademySwitcher from "@/components/academy/MultiAcademySwitcher";
import { useAcademy } from "@/hooks/useAcademy";
import { useStudentDashboard } from "@/hooks/useStudentDashboard";
import { ProgressTracker } from "@/components/student/ProgressTracker";
import { StudentPaymentSummary } from "@/components/student/StudentPaymentSummary";
import { ClassReservationsSidebar } from "@/components/classes/ClassReservationsSidebar";
import { LocationCheckIn } from "@/components/checkin/LocationCheckIn";
import { useLocationCheckIn } from "@/hooks/useLocationCheckIn";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useEffectiveRole();
  const { academy, currentAcademyId } = useAcademy();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const { stats: studentStats, loading: studentLoading, refreshData } = useStudentDashboard();
  const { canCheckIn, availableReservations, locationError } = useLocationCheckIn();

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
      <TouchOptimized className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-1 sm:py-2">
          {/* Main Header - Admin Dashboard Title with Academy Switcher */}
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'} mb-3`}>
            {/* Left side - Title only */}
            <div className="flex items-center gap-2 sm:gap-3">
              <BarChart3 className="h-5 w-5 sm:h-6 md:h-8 text-primary" />
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

          {/* Navigation Tabs - Mobile Responsive */}
          <div className="space-y-6 mb-8">
            {isMobile ? (
              // Mobile: Dropdown navigation
              <div className="border-b border-border pb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {selectedTab === 'overview' && 'Overview'}
                        {selectedTab === 'contacts' && 'Contacts'}
                        {selectedTab === 'payments' && 'Payments'}
                        {selectedTab === 'attendance' && 'Attendance'}
                        {selectedTab === 'reporting' && 'Reporting'}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full bg-background">
                    <DropdownMenuItem 
                      onClick={() => setSelectedTab('overview')}
                      className={selectedTab === 'overview' ? 'bg-muted' : ''}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Overview
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedTab('contacts');
                        navigate('/contacts');
                      }}
                      className={selectedTab === 'contacts' ? 'bg-muted' : ''}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Contacts
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedTab('payments');
                        navigate('/payments');
                      }}
                      className={selectedTab === 'payments' ? 'bg-muted' : ''}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Payments
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedTab('attendance');
                        navigate('/attendance');
                      }}
                      className={selectedTab === 'attendance' ? 'bg-muted' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Attendance
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedTab('reporting');
                        navigate('/reports');
                      }}
                      className={selectedTab === 'reporting' ? 'bg-muted' : ''}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Reporting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/automations')}>
                      <Activity className="h-4 w-4 mr-2" />
                      Automations
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              // Desktop/Tablet: Horizontal tab navigation
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
              </div>
            )}

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

          </div>

          {/* Only show overview content when overview tab is selected */}
          {selectedTab === 'overview' && (
            <>
              {/* Quick Stats Overview - Responsive Grid */}
              <div className={`grid gap-3 mb-6 ${
                isMobile 
                  ? 'grid-cols-2' 
                  : isTablet 
                    ? 'grid-cols-3' 
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
              }`}>
                {quickStats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <TouchOptimized key={index}>
                      <Card className={`hover:shadow-lg transition-shadow flex flex-col relative ${
                        isMobile ? 'h-28' : 'h-32'
                      }`}>
                        <CardHeader className={`pb-2 px-3 pt-3 min-h-[36px] ${isMobile ? 'pr-10' : 'pr-12'}`}>
                          <CardTitle className={`font-medium text-muted-foreground leading-tight ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}>
                            {stat.title}
                          </CardTitle>
                          <IconComponent className={`${stat.color} absolute top-3 right-3 ${
                            isMobile ? 'h-4 w-4' : 'h-5 w-5'
                          }`} />
                        </CardHeader>
                        <CardContent className={`flex-1 flex flex-col justify-end px-3 pb-3 pt-0`}>
                          <div className={`font-bold text-black mb-1 ${
                            isMobile ? 'text-xl' : 'text-2xl'
                          }`}>{stat.value}</div>
                          <div className="h-[16px] flex items-end">
                            <p className={`leading-none ${
                              stat.trend === 'up' ? 'text-green-600' : 
                              stat.trend === 'down' ? 'text-red-600' : 
                              'text-muted-foreground'
                            } ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                              {stat.change}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TouchOptimized>
                  );
                })}
              </div>
              
              {/* Performance Overview - Responsive Cards */}
              <div className={`grid gap-4 mb-6 ${
                isMobile ? 'grid-cols-1' : 'md:grid-cols-3'
              }`}>
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
                        <div className="text-3xl font-bold">0%</div>
                        <div className="text-sm text-muted-foreground">No data from last month</div>
                      </div>
                      <Progress value={0} className="h-2" />
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
                        <div className="text-3xl font-bold">0%</div>
                        <div className="text-sm text-muted-foreground">No data from last month</div>
                      </div>
                      <Progress value={0} className="h-2" />
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
                        <div className="text-3xl font-bold">0%</div>
                        <div className="text-sm text-muted-foreground">No data from last month</div>
                      </div>
                      <Progress value={0} className="h-2" />
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
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Activity will appear here when students enroll, make payments, or schedule tests</p>
                    </div>
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
      </TouchOptimized>
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

        {/* Main Dashboard Layout - 5 Cards in a Row */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {/* Location-Based Check-In Card */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className={`p-3 flex flex-col cursor-pointer hover:shadow-lg transition-all ${
                canCheckIn 
                  ? 'border-green-300 bg-green-50 hover:bg-green-100' 
                  : locationError 
                    ? 'border-red-300 bg-red-50 hover:bg-red-100'
                    : 'border-orange-300 bg-orange-50 hover:bg-orange-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-muted-foreground">Location Check-In</h3>
                  <UserCheck className={`h-3 w-3 ${
                    canCheckIn 
                      ? 'text-green-600' 
                      : locationError 
                        ? 'text-red-600'
                        : 'text-orange-600'
                  }`} />
                </div>
                <div className="flex flex-col justify-center flex-1 text-center">
                  <p className={`text-sm font-bold mb-1 ${
                    canCheckIn 
                      ? 'text-green-700' 
                      : locationError 
                        ? 'text-red-700'
                        : 'text-orange-700'
                  }`}>
                    {canCheckIn 
                      ? `Check In (${availableReservations.length})` 
                      : locationError 
                        ? 'Location Error'
                        : 'Check In'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {canCheckIn 
                      ? 'Classes available'
                      : locationError 
                        ? 'Enable location'
                        : 'No classes nearby'
                    }
                  </p>
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Location-Based Check-In</DialogTitle>
              </DialogHeader>
              <LocationCheckIn />
            </DialogContent>
          </Dialog>

          {/* Student Since Card */}
          <Card className="p-3 flex flex-col min-h-[120px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">Student Since</h3>
              <User className="h-3 w-3 text-blue-500" />
            </div>
            <div className="flex flex-col justify-center flex-1">
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

          {/* Total Classes Card */}
          <Card className="p-3 flex flex-col min-h-[120px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">Total Classes</h3>
              <BarChart3 className="h-3 w-3 text-green-500" />
            </div>
            <div className="flex flex-col justify-center flex-1">
              <p className="text-lg font-bold">{studentLoading ? '...' : studentStats.totalClasses}</p>
              <p className="text-xs text-muted-foreground">
                {studentStats.attendanceRate > 0 ? `${studentStats.attendanceRate.toFixed(0)}% attendance` : 'No attendance yet'}
              </p>
            </div>
          </Card>

          {/* Current Belt Card */}
          <Card className="p-3 flex flex-col min-h-[120px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">Current Belt</h3>
              <Award className="h-3 w-3 text-purple-500" />
            </div>
            <div className="flex flex-col justify-center flex-1">
              <p className="text-lg font-bold">{profile.belt_level || 'White'}</p>
              <p className="text-xs text-muted-foreground">
                {studentStats.totalClasses > 20 ? 'Ready for testing' : `${Math.max(0, 20 - studentStats.totalClasses)} classes to next`}
              </p>
            </div>
          </Card>

          {/* Next Class Card */}
          <Card className="p-3 flex flex-col min-h-[120px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-medium text-muted-foreground">Next Class</h3>
              <Calendar className="h-3 w-3 text-orange-500" />
            </div>
            <div className="flex flex-col justify-center flex-1">
              {studentStats.nextClass ? (
                <>
                  <p className="text-sm font-bold">{studentStats.nextClass.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(studentStats.nextClass.date), 'EEE, MMM d')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(`2000-01-01T${studentStats.nextClass.start_time}`), 'h:mm a')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold">None</p>
                  <p className="text-xs text-muted-foreground">No classes scheduled</p>
                </>
              )}
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
            onClick={() => navigate('/student-attendance')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                Attendance
              </CardTitle>
              <CardDescription className="text-xs">Track your class attendance</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button size="sm" className="w-full text-xs" onClick={(e) => { e.stopPropagation(); navigate('/student-attendance'); }}>
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

        {/* Class Reservations */}
        <div className="mt-6">
          <ClassReservationsSidebar onReservationChange={refreshData} />
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