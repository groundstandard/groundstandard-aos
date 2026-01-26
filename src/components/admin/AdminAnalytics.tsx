import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Award,
  BarChart3,
  Activity,
  Clock,
  Target
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
  attendanceRate: number;
  monthlyRevenue: number;
  newEnrollments: number;
  beltPromotions: number;
  upcomingEvents: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'promotion' | 'class' | 'payment';
  message: string;
  timestamp: string;
  user: string;
}

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // For now, we'll get data for the current user since academy structure isn't fully set up yet
      // We'll filter by admin role to get academy-wide data
      
      if (!profile || profile.role !== 'admin') {
        toast({
          title: "Access Restricted",
          description: "Analytics are only available to administrators.",
          variant: "destructive"
        });
        return;
      }

      // Fetch all the data in parallel
      const [
        profilesResponse,
        classesResponse,
        attendanceResponse,
        paymentsResponse,
        eventsResponse,
        beltTestsResponse
      ] = await Promise.all([
        // Total and active students
        supabase
          .from('profiles')
          .select('id, membership_status, created_at'),
        
        // Total classes
        supabase
          .from('classes')
          .select('id')
          .eq('is_active', true),
        
        // Attendance data for current month
        supabase
          .from('attendance')
          .select('id, status, date')
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        
        // Payments for current month
        supabase
          .from('payments')
          .select('amount, status, payment_date')
          .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .eq('status', 'completed'),
        
        // Upcoming events
        supabase
          .from('events')
          .select('id, date')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(10),
        
        // Belt tests this month
        supabase
          .from('belt_tests')
          .select('id, result')
          .gte('test_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ]);

      // Check for errors
      if (profilesResponse.error) throw profilesResponse.error;
      if (classesResponse.error) throw classesResponse.error;
      if (attendanceResponse.error) throw attendanceResponse.error;
      if (paymentsResponse.error) throw paymentsResponse.error;
      if (eventsResponse.error) throw eventsResponse.error;
      if (beltTestsResponse.error) throw beltTestsResponse.error;

      const profiles = profilesResponse.data || [];
      const classes = classesResponse.data || [];
      const attendance = attendanceResponse.data || [];
      const payments = paymentsResponse.data || [];
      const events = eventsResponse.data || [];
      const beltTests = beltTestsResponse.data || [];

      // Calculate analytics
      const totalStudents = profiles.length;
      const activeStudents = profiles.filter(p => p.membership_status === 'active').length;
      const totalClasses = classes.length;
      
      // Calculate attendance rate
      const presentAttendance = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = attendance.length > 0 ? Math.round((presentAttendance / attendance.length) * 100) : 0;
      
      // Calculate monthly revenue (convert from cents to dollars)
      const monthlyRevenue = Math.round(payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / 100);
      
      // New enrollments this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const newEnrollments = profiles.filter(p => new Date(p.created_at) >= startOfMonth).length;
      
      // Belt promotions this month (passed tests)
      const beltPromotions = beltTests.filter(bt => bt.result === 'pass').length;
      
      const upcomingEvents = events.length;

      const analyticsData: AnalyticsData = {
        totalStudents,
        activeStudents,
        totalClasses,
        attendanceRate,
        monthlyRevenue,
        newEnrollments,
        beltPromotions,
        upcomingEvents
      };

      // Fetch recent activity
      const recentActivityData = await fetchRecentActivity();

      setAnalytics(analyticsData);
      setRecentActivity(recentActivityData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: "Error Loading Analytics",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async (): Promise<RecentActivity[]> => {
    try {
      const activities: RecentActivity[] = [];

      // Get recent enrollments
      const { data: recentProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentProfiles) {
        recentProfiles.forEach(profile => {
          activities.push({
            id: `enrollment-${profile.id}`,
            type: 'enrollment',
            message: `New student ${profile.first_name} ${profile.last_name} enrolled`,
            timestamp: formatTimestamp(profile.created_at),
            user: `${profile.first_name} ${profile.last_name}`
          });
        });
      }

      // Get recent payments - we'll fetch payments first, then get profile data separately
      const { data: recentPayments } = await supabase
        .from('payments')
        .select('id, amount, payment_date, student_id')
        .eq('status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(3);

      if (recentPayments && recentPayments.length > 0) {
        // Get profile names for the payment students
        const studentIds = recentPayments.map(p => p.student_id);
        const { data: paymentStudents } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', studentIds);

        recentPayments.forEach(payment => {
          const student = paymentStudents?.find(s => s.id === payment.student_id);
          if (student) {
            activities.push({
              id: `payment-${payment.id}`,
              type: 'payment',
              message: `Payment of $${(payment.amount / 100).toFixed(2)} received from ${student.first_name} ${student.last_name}`,
              timestamp: formatTimestamp(payment.payment_date),
              user: `${student.first_name} ${student.last_name}`
            });
          }
        });
      }

      // Get recent belt promotions - same approach
      const { data: recentBeltTests } = await supabase
        .from('belt_tests')
        .select('id, target_belt, test_date, student_id')
        .eq('result', 'pass')
        .order('test_date', { ascending: false })
        .limit(2);

      if (recentBeltTests && recentBeltTests.length > 0) {
        // Get profile names for the belt test students
        const testStudentIds = recentBeltTests.map(t => t.student_id);
        const { data: testStudents } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', testStudentIds);

        recentBeltTests.forEach(test => {
          const student = testStudents?.find(s => s.id === test.student_id);
          if (student) {
            activities.push({
              id: `promotion-${test.id}`,
              type: 'promotion',
              message: `${student.first_name} ${student.last_name} promoted to ${test.target_belt}`,
              timestamp: formatTimestamp(test.test_date),
              user: `${student.first_name} ${student.last_name}`
            });
          }
        });
      }

      // Sort by timestamp (most recent first)
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      return [];
    }
  };

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'promotion':
        return <Award className="h-4 w-4 text-yellow-600" />;
      case 'class':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'enrollment':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'promotion':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'class':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <Card className="card-minimal">
          <CardContent className="p-6">
            <div className="text-center">Loading analytics...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Key Metrics */}
      <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <Card className="card-minimal shadow-soft hover:shadow-medium transition-smooth max-w-full overflow-hidden">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground truncate`}>Total Students</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>{analytics.totalStudents}</p>
                <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-green-600 flex items-center mt-1`}>
                  <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">+{analytics.newEnrollments} this month</span>
                </p>
              </div>
              <div className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Users className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-blue-600`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal shadow-soft hover:shadow-medium transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-foreground">{analytics.activeStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((analytics.activeStudents / analytics.totalStudents) * 100)}% active rate
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal shadow-soft hover:shadow-medium transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold text-foreground">{analytics.attendanceRate}%</p>
                <div className="mt-2">
                  <Progress value={analytics.attendanceRate} className="h-2" />
                </div>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal shadow-soft hover:shadow-medium transition-smooth">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold text-foreground">${analytics.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.2% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-minimal shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Class Performance</h3>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Classes</span>
                <span className="font-medium">{analytics.totalClasses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Class Size</span>
                <span className="font-medium">8.3 students</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="font-medium text-green-600">94%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Belt Progressions</h3>
              <Award className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="font-medium">{analytics.beltPromotions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Reviews</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Testing</span>
                <span className="font-medium">12 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upcoming Events</h3>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Belt Testing</span>
                <span className="font-medium">March 15</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tournament</span>
                <span className="font-medium">April 2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Open House</span>
                <span className="font-medium">March 30</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="card-minimal shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30 transition-smooth"
              >
                <div className="flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  <Badge className={getActivityBadgeColor(activity.type)}>
                    {activity.type}
                  </Badge>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{activity.user}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};