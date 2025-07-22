import { useState } from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleQuickAction = (action: string) => {
    toast({
      title: "Quick Action",
      description: `${action} feature will be implemented soon`,
    });
  };

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
      value: "247",
      change: "+12",
      changeType: "increase",
      icon: Users,
      description: "Active members",
      color: "text-blue-600"
    },
    {
      title: "Monthly Revenue",
      value: "$18,540",
      change: "+8.2%",
      changeType: "increase",
      icon: DollarSign,
      description: "This month",
      color: "text-green-600"
    },
    {
      title: "Class Attendance",
      value: "89%",
      change: "+5.1%",
      changeType: "increase",
      icon: Target,
      description: "Weekly average",
      color: "text-purple-600"
    },
    {
      title: "Belt Promotions",
      value: "23",
      change: "+3",
      changeType: "increase",
      icon: Award,
      description: "This quarter",
      color: "text-orange-600"
    }
  ];

  const recentActivities = [
    {
      type: "enrollment",
      message: "5 new students enrolled in Advanced Karate",
      time: "2 hours ago",
      icon: Users,
      color: "text-blue-500"
    },
    {
      type: "payment",
      message: "Premium subscription renewed by 12 members",
      time: "4 hours ago",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      type: "achievement",
      message: "Belt testing completed for 8 students",
      time: "1 day ago",
      icon: Award,
      color: "text-yellow-500"
    },
    {
      type: "class",
      message: "New Beginner's Class scheduled for next week",
      time: "2 days ago",
      icon: Calendar,
      color: "text-purple-500"
    }
  ];

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

  const systemHealth = {
    attendance: { status: "good", value: 95 },
    payments: { status: "excellent", value: 98 },
    engagement: { status: "good", value: 87 },
    retention: { status: "excellent", value: 94 }
  };

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
          <div className="grid grid-cols-3 lg:grid-cols-7 gap-4">
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Admin
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/team-management')}>
                  <Users className="h-4 w-4 mr-2" />
                  Team Management
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/events')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/belt-testing')}>
                  <Award className="h-4 w-4 mr-2" />
                  Belt Testing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickAction("Memberships")}>
                  <Users className="h-4 w-4 mr-2" />
                  Memberships
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/performance-targets')}>
                  <Target className="h-4 w-4 mr-2" />
                  Performance Targets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <div className="text-lg font-bold">247</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-2 w-2 text-green-500" />
              <span className="text-green-500">+12</span>
              <span>Active members</span>
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
            <div className="text-lg font-bold">$18,540</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-2 w-2 text-green-500" />
              <span className="text-green-500">+8.2%</span>
              <span>This month</span>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 w-1 h-full bg-green-600" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Class Attendance</CardTitle>
            <Target className="h-3 w-3 text-purple-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">89%</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-2 w-2 text-green-500" />
              <span className="text-green-500">+5.1%</span>
              <span>Weekly average</span>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 w-1 h-full bg-purple-600" />
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium">Belt Promotions</CardTitle>
            <Award className="h-3 w-3 text-orange-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">23</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-2 w-2 text-green-500" />
              <span className="text-green-500">+3</span>
              <span>This quarter</span>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 w-1 h-full bg-orange-600" />
        </Card>
      </div>



      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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