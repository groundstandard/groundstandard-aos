import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  const { subscriptionInfo } = useSubscription();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [scheduleClassOpen, setScheduleClassOpen] = useState(false);
  const [processPaymentOpen, setProcessPaymentOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
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
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        <BackButton />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Complete overview of your martial arts academy
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Profile Management</DialogTitle>
                  <DialogDescription>Manage your admin profile and account settings</DialogDescription>
                </DialogHeader>
                <ProfileView />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Actions - Moved to top and made smaller */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col space-y-1 p-3"
                    size="sm"
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Add Student</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>Enter student information to add them to the academy</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="Enter first name" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Enter last name" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter email address" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="Enter phone number" />
                    </div>
                    <div>
                      <Label htmlFor="beltLevel">Belt Level</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select belt level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="white">White Belt</SelectItem>
                          <SelectItem value="yellow">Yellow Belt</SelectItem>
                          <SelectItem value="orange">Orange Belt</SelectItem>
                          <SelectItem value="green">Green Belt</SelectItem>
                          <SelectItem value="blue">Blue Belt</SelectItem>
                          <SelectItem value="brown">Brown Belt</SelectItem>
                          <SelectItem value="black">Black Belt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
                      <Button onClick={() => {
                        toast({ title: "Student added successfully!" });
                        setAddStudentOpen(false);
                      }}>Add Student</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={scheduleClassOpen} onOpenChange={setScheduleClassOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col space-y-1 p-3"
                    size="sm"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs">Schedule Class</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule New Class</DialogTitle>
                    <DialogDescription>Create a new class session</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="className">Class Name</Label>
                      <Input id="className" placeholder="e.g., Advanced Karate" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="classDate">Date</Label>
                        <Input id="classDate" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="classTime">Time</Label>
                        <Input id="classTime" type="time" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="instructor">Instructor</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sensei-johnson">Sensei Johnson</SelectItem>
                          <SelectItem value="master-chen">Master Chen</SelectItem>
                          <SelectItem value="instructor-smith">Instructor Smith</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxStudents">Max Students</Label>
                      <Input id="maxStudents" type="number" placeholder="20" />
                    </div>
                    <div>
                      <Label htmlFor="classDescription">Description</Label>
                      <Textarea id="classDescription" placeholder="Class description..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setScheduleClassOpen(false)}>Cancel</Button>
                      <Button onClick={() => {
                        toast({ title: "Class scheduled successfully!" });
                        setScheduleClassOpen(false);
                      }}>Schedule Class</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={processPaymentOpen} onOpenChange={setProcessPaymentOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-16 flex-col space-y-1 p-3"
                    size="sm"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Process Payment</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Process Payment</DialogTitle>
                    <DialogDescription>Record a payment from a student</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="studentSelect">Student</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john-doe">John Doe</SelectItem>
                          <SelectItem value="jane-smith">Jane Smith</SelectItem>
                          <SelectItem value="mike-chen">Mike Chen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" type="number" placeholder="150.00" />
                      </div>
                      <div>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit Card</SelectItem>
                            <SelectItem value="debit">Debit Card</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="paymentDescription">Description</Label>
                      <Input id="paymentDescription" placeholder="e.g., Monthly membership fee" />
                    </div>
                    <div>
                      <Label htmlFor="paymentNotes">Notes (Optional)</Label>
                      <Textarea id="paymentNotes" placeholder="Additional notes..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setProcessPaymentOpen(false)}>Cancel</Button>
                      <Button onClick={() => {
                        toast({ title: "Payment processed successfully!" });
                        setProcessPaymentOpen(false);
                      }}>Process Payment</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                onClick={() => handleQuickAction("Generate Report")}
                className="h-16 flex-col space-y-1 p-3"
                size="sm"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview - Moved up */}
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