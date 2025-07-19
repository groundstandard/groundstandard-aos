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

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Mock analytics data
      const mockAnalytics: AnalyticsData = {
        totalStudents: 127,
        activeStudents: 98,
        totalClasses: 24,
        attendanceRate: 85,
        monthlyRevenue: 15420,
        newEnrollments: 12,
        beltPromotions: 8,
        upcomingEvents: 3
      };

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'enrollment',
          message: 'New student Alex Chen enrolled in Beginner Karate',
          timestamp: '2 hours ago',
          user: 'Alex Chen'
        },
        {
          id: '2',
          type: 'promotion',
          message: 'Sarah Kim promoted to Yellow Belt',
          timestamp: '4 hours ago',
          user: 'Sarah Kim'
        },
        {
          id: '3',
          type: 'class',
          message: 'Advanced Martial Arts class completed',
          timestamp: '6 hours ago',
          user: 'Sensei Martinez'
        },
        {
          id: '4',
          type: 'payment',
          message: 'Monthly payment received from Mike Johnson',
          timestamp: '1 day ago',
          user: 'Mike Johnson'
        },
        {
          id: '5',
          type: 'enrollment',
          message: 'Emily Davis enrolled in Teen Martial Arts',
          timestamp: '1 day ago',
          user: 'Emily Davis'
        }
      ];

      setAnalytics(mockAnalytics);
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
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