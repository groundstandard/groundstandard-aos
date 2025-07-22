import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useView } from "@/hooks/useView";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/BackButton";
import { Navigate } from "react-router-dom";
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
      value: "847",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Classes",
      value: "24",
      change: "+8.2%", 
      trend: "up",
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: "$18,420",
      change: "+15.3%",
      trend: "up", 
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Attendance Rate",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      icon: TrendingUp,
      color: "text-orange-600"
    },
    {
      title: "Belt Tests",
      value: "18",
      change: "Pending",
      trend: "neutral",
      icon: Award,
      color: "text-yellow-600"
    },
    {
      title: "Active Subscriptions", 
      value: "743",
      change: "+5.7%",
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
                  <span className="text-sm text-muted-foreground">96%</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Class Capacity</span>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Revenue Goal</span>
                  <span className="text-sm text-muted-foreground">84%</span>
                </div>
                <Progress value={84} className="h-2" />
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
      </div>
    </div>
  );
};

export default Admin;