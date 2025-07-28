import { useState, useEffect } from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useAcademy } from "@/hooks/useAcademy";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
  MessageCircle,
  CreditCard,
  FileText,
  ContactRound,
  ChevronDown,
  Bell,
  User,
  Zap
} from "lucide-react";
import { PaymentSyncButton } from "./PaymentSyncButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { academy } = useAcademy();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  
  // Real data states
  const [stats, setStats] = useState({
    totalStudents: 0,
    monthlyRevenue: 0,
    attendanceRate: 0,
    beltPromotions: 0,
    loading: true
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    attendance: { status: "good", value: 0 },
    payments: { status: "good", value: 0 },
    engagement: { status: "good", value: 0 },
    retention: { status: "good", value: 0 }
  });

  // Fetch real data from database
  const fetchDashboardData = async () => {
    if (!academy?.id) return;
    
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Fetch total students for current academy
      const { data: studentsData } = await supabase
        .from('academy_memberships')
        .select('id')
        .eq('academy_id', academy.id)
        .eq('is_active', true)
        .eq('role', 'student');
      
      // Fetch monthly revenue from payments
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);
      
      // Fetch attendance rate
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('academy_id', academy.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      // Fetch belt promotions this quarter
      const quarterStart = new Date(currentYear, Math.floor(currentMonth / 3) * 3, 1);
      const { data: beltTestsData } = await supabase
        .from('belt_tests')
        .select('id')
        .eq('status', 'passed')
        .gte('test_date', quarterStart.toISOString().split('T')[0]);
      
      // Fetch recent activities
      const { data: activitiesData } = await supabase
        .from('contact_activities')
        .select(`
          *,
          profiles!contact_activities_contact_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Calculate metrics
      const totalStudents = studentsData?.length || 0;
      const monthlyRevenue = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const attendanceRate = attendanceData?.length > 0 
        ? (attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100
        : 0;
      const beltPromotions = beltTestsData?.length || 0;
      
      setStats({
        totalStudents,
        monthlyRevenue,
        attendanceRate,
        beltPromotions,
        loading: false
      });
      
      // Format recent activities
      const formattedActivities = activitiesData?.map(activity => ({
        type: activity.activity_type,
        message: activity.activity_description || activity.activity_title,
        time: new Date(activity.created_at).toLocaleString(),
        icon: activity.activity_type === 'payment' ? DollarSign : 
              activity.activity_type === 'attendance' ? Target :
              activity.activity_type === 'belt_test' ? Award : Users,
        color: activity.activity_type === 'payment' ? 'text-green-500' :
               activity.activity_type === 'attendance' ? 'text-purple-500' :
               activity.activity_type === 'belt_test' ? 'text-yellow-500' : 'text-blue-500'
      })) || [];
      
      setRecentActivities(formattedActivities);
      
      // Calculate system health
      setSystemHealth({
        attendance: { 
          status: attendanceRate > 85 ? "excellent" : attendanceRate > 70 ? "good" : "warning", 
          value: Math.round(attendanceRate) 
        },
        payments: { 
          status: monthlyRevenue > 10000 ? "excellent" : monthlyRevenue > 5000 ? "good" : "warning", 
          value: Math.min(100, Math.round(monthlyRevenue / 200)) 
        },
        engagement: { 
          status: totalStudents > 100 ? "excellent" : totalStudents > 50 ? "good" : "warning", 
          value: Math.min(100, totalStudents * 2) 
        },
        retention: { 
          status: "good", 
          value: Math.max(80, Math.min(100, 90 + (totalStudents / 20))) 
        }
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };
  
  useEffect(() => {
    if (academy?.id) {
      fetchDashboardData();
    }
  }, [academy?.id]);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Dashboard statistics refreshed",
    });
  };

  const handleQuickAction = (action: string) => {
    toast({
      title: "Quick Action",
      description: `${action} feature will be implemented soon`,
    });
  };

  const upcomingTasks = [
    {
      task: "Review belt testing applications",
      priority: "high",
      dueDate: "Today",
      category: "Testing"
    },
    {
      task: "Prepare monthly revenue report",
      priority: "medium",
      dueDate: "Tomorrow",
      category: "Finance"
    },
    {
      task: "Schedule instructor meetings",
      priority: "low",
      dueDate: "This week",
      category: "Management"
    },
    {
      task: "Update class schedules for next month",
      priority: "medium",
      dueDate: "Next week",
      category: "Scheduling"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-500";
      case "good": return "text-blue-500";
      case "warning": return "text-yellow-500";
      case "critical": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between w-full p-4 bg-background border-b">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Complete management and analytics for your martial arts academy
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleRefreshStats}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {refreshing ? "Refreshing..." : "Refresh Stats"}
          </Button>
        </div>
      </div>

      {/* Admin Navigation */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-nowrap gap-2 w-full overflow-x-auto items-center">{/* force all buttons on same line */}
            {/* DEBUG: All 8 buttons should be visible now */}
            <Button
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/contacts')}
            >
              <ContactRound className="h-4 w-4" />
              Contacts
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/payments')}
            >
              <CreditCard className="h-4 w-4" />
              Payments
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/attendance')}
            >
              <Activity className="h-4 w-4" />
              Attendance
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/reports')}
            >
              <FileText className="h-4 w-4" />
              Reporting
            </Button>
            
            
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => handleQuickAction("Automations")}
            >
              <Zap className="h-4 w-4" />
              Automations
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => navigate('/profile')}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Total Students</CardTitle>
            <Users className="h-3 w-3 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">
              {stats.loading ? '...' : stats.totalStudents}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {stats.totalStudents === 0 ? (
                <span>No data from last month</span>
              ) : (
                <>
                  <TrendingUp className="h-2 w-2 text-green-500" />
                  <span className="text-green-500">Active members</span>
                </>
              )}
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 w-1 h-full bg-blue-600" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-3 w-3 text-green-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">
              {stats.loading ? '...' : stats.monthlyRevenue > 0 ? `$${(stats.monthlyRevenue / 100).toLocaleString()}` : '$0'}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {stats.monthlyRevenue === 0 ? (
                <span>No data from last month</span>
              ) : (
                <>
                  <TrendingUp className="h-2 w-2 text-green-500" />
                  <span className="text-green-500">This month</span>
                </>
              )}
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 w-1 h-full bg-green-600" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Attendance Rate</CardTitle>
            <Target className="h-3 w-3 text-purple-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">
              {stats.loading ? '...' : stats.attendanceRate > 0 ? `${Math.round(stats.attendanceRate)}%` : '0%'}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {stats.attendanceRate === 0 ? (
                <span>No data from last month</span>
              ) : (
                <>
                  <TrendingUp className="h-2 w-2 text-green-500" />
                  <span className="text-green-500">Weekly average</span>
                </>
              )}
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 w-1 h-full bg-purple-600" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Belt Tests</CardTitle>
            <Award className="h-3 w-3 text-orange-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">
              {stats.loading ? '...' : stats.beltPromotions}
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {stats.beltPromotions === 0 ? (
                <span>No data from last month</span>
              ) : (
                <>
                  <TrendingUp className="h-2 w-2 text-green-500" />
                  <span className="text-green-500">This quarter</span>
                </>
              )}
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 w-1 h-full bg-orange-600" />
        </Card>
      </div>



      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stripe Payment Sync */}
        <PaymentSyncButton />
        
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
            <CardDescription>Overall academy performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(systemHealth).map(([key, health]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{key}</span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(health.status)}
                  >
                    {health.status}
                  </Badge>
                </div>
                <Progress value={health.value} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">
                  {health.value}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <activity.icon className={`h-4 w-4 mt-1 ${activity.color}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div key={index} className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.task}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{task.category}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.dueDate}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};