import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useView } from "@/hooks/useView";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/BackButton";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProfileView } from "@/components/profile/ProfileView";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  BarChart3,
  Crown,
  Star,
  Clock,
  Target,
  Award,
  Activity,
  Bell,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else {
    return `${days} days ago`;
  }
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { isAdmin } = useEffectiveRole();
  const { setCurrentView } = useView();
  const { subscriptionInfo } = useSubscription();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [scheduleClassOpen, setScheduleClassOpen] = useState(false);
  const [processPaymentOpen, setProcessPaymentOpen] = useState(false);

  // Force admin view when this component loads
  useEffect(() => {
    setCurrentView('admin');
  }, [setCurrentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAddStudent = () => {
    setAddStudentOpen(true);
  };

  const handleScheduleClass = () => {
    setScheduleClassOpen(true);
  };

  const handleProcessPayment = () => {
    setProcessPaymentOpen(true);
  };

  const handleGenerateReport = () => {
    navigate('/reports');
  };

  const handleQuickAction = (action: string) => {
    switch(action) {
      case "Add Student":
        handleAddStudent();
        break;
      case "Schedule Class":
        handleScheduleClass();
        break;
      case "Process Payment":
        handleProcessPayment();
        break;
      case "Generate Report":
        handleGenerateReport();
        break;
      default:
        toast({
          title: "Quick Action",
          description: `${action} feature will be implemented soon`,
        });
    }
  };

  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeClasses: 0,
    monthlyRevenue: 0,
    attendanceRate: 0,
    beltTests: 0,
    activeSubscriptions: 0,
    loading: true
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true);
      
      // Fetch total students
      const { data: students } = await supabase
        .from('profiles')
        .select('id, membership_status, created_at')
        .eq('role', 'student');
      
      // Fetch active classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, is_active')
        .eq('is_active', true);
      
      // Fetch attendance for rate calculation (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id, status, date')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      // Fetch payments for monthly revenue (current month)
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, payment_date')
        .eq('status', 'completed')
        .gte('payment_date', firstDayOfMonth.toISOString().split('T')[0]);
      
      // Fetch pending belt tests
      const { data: beltTests } = await supabase
        .from('belt_tests')
        .select('id, status')
        .eq('status', 'scheduled');

      // Fetch recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Get recent enrollments
      const { data: recentEnrollments } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at')
        .eq('role', 'student')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent payments
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, amount, student_id, payment_date, profiles(first_name, last_name)')
        .eq('status', 'completed')
        .gte('payment_date', yesterday.toISOString())
        .order('payment_date', { ascending: false })
        .limit(5);

      // Get recent belt tests
      const { data: recentBeltTests } = await supabase
        .from('belt_tests')
        .select('id, test_date, student_id, current_belt, target_belt, profiles(first_name, last_name)')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      // Get recent attendance (today)
      const today = new Date().toISOString().split('T')[0];
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select('id, date, status, class_id, classes(name), profiles(first_name, last_name)')
        .eq('date', today)
        .eq('status', 'present')
        .order('created_at', { ascending: false })
        .limit(3);

      // Combine and format activity data
      const activities = [];

      // Add enrollments
      recentEnrollments?.forEach(enrollment => {
        activities.push({
          action: "New student enrollment",
          details: `${enrollment.first_name} ${enrollment.last_name} joined the academy`,
          time: formatTimeAgo(enrollment.created_at),
          type: "enrollment"
        });
      });

      // Add payments
      recentPayments?.forEach(payment => {
        const student = payment.profiles as any;
        activities.push({
          action: "Payment received",
          details: `$${(payment.amount / 100)} from ${student?.first_name} ${student?.last_name}`,
          time: formatTimeAgo(payment.payment_date),
          type: "payment"
        });
      });

      // Add belt tests
      recentBeltTests?.forEach(test => {
        const student = test.profiles as any;
        activities.push({
          action: "Belt test scheduled",
          details: `${student?.first_name} ${student?.last_name} registered for ${test.target_belt} test`,
          time: formatTimeAgo(test.test_date),
          type: "test"
        });
      });

      // Add attendance
      recentAttendance?.forEach(att => {
        const student = att.profiles as any;
        const classInfo = att.classes as any;
        activities.push({
          action: "Class attendance",
          details: `${student?.first_name} ${student?.last_name} attended ${classInfo?.name}`,
          time: formatTimeAgo(att.date),
          type: "class"
        });
      });

      // Sort by time and take most recent
      const sortedActivities = activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 4);

      setRecentActivity(sortedActivities);
      
      // Calculate stats
      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter(s => s.membership_status === 'active').length || 0;
      const activeClasses = classes?.length || 0;
      const totalAttendance = attendance?.length || 0;
      const presentAttendance = attendance?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
      const monthlyRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const beltTestCount = beltTests?.length || 0;
      
      setDashboardStats({
        totalStudents,
        activeClasses,
        monthlyRevenue: Math.round(monthlyRevenue / 100), // Convert cents to dollars
        attendanceRate,
        beltTests: beltTestCount,
        activeSubscriptions: activeStudents,
        loading: false
      });
      
      toast({
        title: "Success",
        description: "Dashboard statistics refreshed",
      });
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to refresh dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshStats = () => {
    fetchDashboardStats();
  };

  // Load dashboard stats on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const quickStats = [
    {
      title: "Total Students",
      value: dashboardStats.loading ? "..." : dashboardStats.totalStudents.toString(),
      change: "+12.5%", // TODO: Calculate from historical data
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Classes",
      value: dashboardStats.loading ? "..." : dashboardStats.activeClasses.toString(),
      change: "+8.2%", // TODO: Calculate from historical data
      trend: "up",
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: dashboardStats.loading ? "..." : `$${dashboardStats.monthlyRevenue.toLocaleString()}`,
      change: "+15.3%", // TODO: Calculate from historical data
      trend: "up", 
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Attendance Rate",
      value: dashboardStats.loading ? "..." : `${dashboardStats.attendanceRate}%`,
      change: "+2.1%", // TODO: Calculate from historical data
      trend: "up",
      icon: TrendingUp,
      color: "text-orange-600"
    },
    {
      title: "Belt Tests",
      value: dashboardStats.loading ? "..." : dashboardStats.beltTests.toString(),
      change: "Pending",
      trend: "neutral",
      icon: Award,
      color: "text-yellow-600"
    },
    {
      title: "Active Subscriptions", 
      value: dashboardStats.loading ? "..." : dashboardStats.activeSubscriptions.toString(),
      change: "+5.7%", // TODO: Calculate from historical data
      trend: "up",
      icon: Crown,
      color: "text-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-6">
          <BackButton />
          
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Complete management and analytics for your martial arts academy
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-8 border-b border-border pb-4">
            <Button variant="ghost" className="flex items-center gap-2 text-primary border-b-2 border-primary pb-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </Button>
            <Button variant="ghost" className="flex items-center gap-2 hover:text-primary" onClick={() => navigate('/reports')}>
              <BarChart3 className="h-4 w-4" />
              Reports
            </Button>
            <Button variant="ghost" className="flex items-center gap-2 hover:text-primary" onClick={() => navigate('/contacts')}>
              <Users className="h-4 w-4" />
              Students
            </Button>
            <Button variant="ghost" className="flex items-center gap-2 hover:text-primary" onClick={() => navigate('/classes')}>
              <Calendar className="h-4 w-4" />
              Classes
            </Button>
            <Button variant="ghost" className="flex items-center gap-2 hover:text-primary" onClick={() => navigate('/payments')}>
              <DollarSign className="h-4 w-4" />
              Payments
            </Button>
            <Button variant="ghost" className="flex items-center gap-2 hover:text-primary" onClick={() => navigate('/automations')}>
              <Settings className="h-4 w-4" />
              Automations
            </Button>
          </div>
        </div>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
                <CardDescription>Key metrics for this month</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshStats} disabled={refreshing}>
                <Activity className="h-4 w-4 mr-2" />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Student Retention</span>
                  <span className="text-sm text-muted-foreground">0%</span>
                </div>
                <Progress value={0} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">No data from last month</div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Class Capacity</span>
                  <span className="text-sm text-muted-foreground">0%</span>
                </div>
                <Progress value={0} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">No data from last month</div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Revenue Goal</span>
                  <span className="text-sm text-muted-foreground">0%</span>
                </div>
                <Progress value={0} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">No data from last month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {stat.change} from last month
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your academy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-xs">Activity will appear here as students interact with your academy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;