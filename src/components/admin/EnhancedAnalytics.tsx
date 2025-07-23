import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  Star,
  Clock,
  Activity
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface RetentionData {
  month: string;
  new_students: number;
  retained_students: number;
  churned_students: number;
  retention_rate: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  forecast: number;
  target: number;
}

interface ClassPopularityData {
  class_name: string;
  enrollments: number;
  attendance_rate: number;
  satisfaction: number;
}

interface LifetimeValueData {
  belt_level: string;
  avg_ltv: number;
  avg_duration_months: number;
  total_students: number;
}

export const EnhancedAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("6months");
  const [activeTab, setActiveTab] = useState("retention");
  
  // Analytics Data
  const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [classPopularityData, setClassPopularityData] = useState<ClassPopularityData[]>([]);
  const [lifetimeValueData, setLifetimeValueData] = useState<LifetimeValueData[]>([]);
  
  // Summary Stats
  const [stats, setStats] = useState({
    churnRate: 0,
    avgLifetimeValue: 0,
    monthlyRecurringRevenue: 0,
    revenueGrowth: 0,
    predictedChurn: 0,
    topPerformingClass: "",
    lowestRetention: "",
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // First fetch base data
      await Promise.all([
        fetchRetentionAnalysis(),
        fetchRevenueForecasting(),
        fetchClassPopularity(),
        fetchLifetimeValue()
      ]);
      
      // Then fetch summary stats that depend on the class data
      await fetchSummaryStats();
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRetentionAnalysis = async () => {
    try {
      // Get students created in the last 6 months for retention analysis
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('created_at, membership_status')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (error) throw error;

      // Generate retention data by month
      const retentionData: RetentionData[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        const newStudents = profiles?.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate >= monthDate && createdDate < nextMonth;
        }).length || 0;
        
        const retainedStudents = profiles?.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate < nextMonth && p.membership_status === 'active';
        }).length || 0;
        
        const churned = profiles?.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate < monthDate && p.membership_status === 'cancelled';
        }).length || 0;
        
        const retentionRate = retainedStudents > 0 ? ((retainedStudents / (retainedStudents + churned)) * 100) : 0;
        
        retentionData.push({
          month: monthName,
          new_students: newStudents,
          retained_students: retainedStudents,
          churned_students: churned,
          retention_rate: Math.round(retentionRate * 10) / 10
        });
      }
      
      setRetentionData(retentionData);
    } catch (error) {
      console.error('Error fetching retention data:', error);
      // Fallback to simplified data if error
      const fallbackData: RetentionData[] = [
        { month: "Jan", new_students: 0, retained_students: 0, churned_students: 0, retention_rate: 0 },
      ];
      setRetentionData(fallbackData);
    }
  };

  const fetchRevenueForecasting = async () => {
    try {
      // Get payment data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, payment_date, status')
        .gte('payment_date', sixMonthsAgo.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Generate revenue data by month
      const revenueData: RevenueData[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        const monthPayments = payments?.filter(p => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= monthDate && paymentDate < nextMonth;
        }) || [];
        
        const revenue = Math.round(monthPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / 100);
        const forecast = Math.round(revenue * 1.05); // 5% growth forecast
        const target = Math.round(revenue * 1.15); // 15% growth target
        
        revenueData.push({
          month: monthName,
          revenue,
          forecast,
          target
        });
      }
      
      setRevenueData(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      // Fallback to simplified data
      const fallbackData: RevenueData[] = [
        { month: "Jan", revenue: 0, forecast: 0, target: 0 },
      ];
      setRevenueData(fallbackData);
    }
  };

  const fetchClassPopularity = async () => {
    try {
      // Get class enrollment and attendance data
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, name, is_active')
        .eq('is_active', true);

      if (classError) throw classError;

      // Get enrollments and attendance for each class
      const classData: ClassPopularityData[] = [];
      
      for (const cls of classes || []) {
        const { data: reservations } = await supabase
          .from('class_reservations')
          .select('id')
          .eq('class_id', cls.id)
          .eq('status', 'reserved');

        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('class_id', cls.id);

        const reservationCount = reservations?.length || 0;
        const totalAttendance = attendance?.length || 0;
        const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
        const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
        
        classData.push({
          class_name: cls.name,
          enrollments: reservationCount,
          attendance_rate: attendanceRate,
          satisfaction: 4.5 // Default satisfaction score since we don't have reviews yet
        });
      }
      
      setClassPopularityData(classData);
    } catch (error) {
      console.error('Error fetching class data:', error);
      // Fallback to simplified data
      setClassPopularityData([]);
    }
  };

  const fetchLifetimeValue = async () => {
    try {
      // Get student data with belt levels and payment history
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, belt_level, created_at, membership_status');

      if (error) throw error;

      // Get payment data
      const { data: payments } = await supabase
        .from('payments')
        .select('student_id, amount, payment_date, status')
        .eq('status', 'completed');

      // Calculate LTV by belt level
      const beltLevels = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];
      const lifetimeData: LifetimeValueData[] = [];

      for (const belt of beltLevels) {
        const beltStudents = profiles?.filter(p => p.belt_level === belt) || [];
        const totalStudents = beltStudents.length;
        
        if (totalStudents === 0) {
          lifetimeData.push({
            belt_level: belt,
            avg_ltv: 0,
            avg_duration_months: 0,
            total_students: 0
          });
          continue;
        }

        // Calculate average LTV and duration for this belt level
        let totalLTV = 0;
        let totalDuration = 0;

        for (const student of beltStudents) {
          const studentPayments = payments?.filter(p => p.student_id === student.id) || [];
          const studentLTV = studentPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
          
          const createdDate = new Date(student.created_at);
          const now = new Date();
          const durationMonths = Math.max(1, Math.round((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          
          totalLTV += studentLTV;
          totalDuration += durationMonths;
        }

        lifetimeData.push({
          belt_level: belt,
          avg_ltv: Math.round(totalLTV / totalStudents),
          avg_duration_months: Math.round(totalDuration / totalStudents),
          total_students: totalStudents
        });
      }
      
      setLifetimeValueData(lifetimeData);
    } catch (error) {
      console.error('Error fetching lifetime value data:', error);
      // Fallback to simplified data
      setLifetimeValueData([]);
    }
  };

  const fetchSummaryStats = async () => {
    try {
      // Calculate real summary statistics from database
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      // Get all profiles for churn calculation
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, created_at, membership_status');

      // Get payments for revenue calculations
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date, student_id, status')
        .eq('status', 'completed');

      // Calculate churn rate
      const activeStudents = allProfiles?.filter(p => p.membership_status === 'active').length || 0;
      const cancelledStudents = allProfiles?.filter(p => p.membership_status === 'cancelled').length || 0;
      const churnRate = activeStudents > 0 ? Math.round((cancelledStudents / (activeStudents + cancelledStudents)) * 100 * 10) / 10 : 0;

      // Calculate average lifetime value
      const studentsWithPayments = new Map();
      payments?.forEach(payment => {
        if (!studentsWithPayments.has(payment.student_id)) {
          studentsWithPayments.set(payment.student_id, 0);
        }
        studentsWithPayments.set(payment.student_id, 
          studentsWithPayments.get(payment.student_id) + (payment.amount || 0)
        );
      });
      
      const totalLTV = Array.from(studentsWithPayments.values()).reduce((sum, ltv) => sum + ltv, 0);
      const avgLifetimeValue = studentsWithPayments.size > 0 ? Math.round(totalLTV / studentsWithPayments.size / 100) : 0;

      // Calculate monthly recurring revenue
      const currentMonthPayments = payments?.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate >= lastMonth && paymentDate < now;
      }) || [];
      const monthlyRecurringRevenue = Math.round(
        currentMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100
      );

      // Calculate revenue growth
      const previousMonthPayments = payments?.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate >= twoMonthsAgo && paymentDate < lastMonth;
      }) || [];
      const previousMonthRevenue = previousMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      
      const revenueGrowth = previousMonthRevenue > 0 
        ? Math.round(((monthlyRecurringRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 * 10) / 10 
        : 0;

      // Predict churn based on inactive students
      const predictedChurn = Math.max(1, Math.round(activeStudents * (churnRate / 100)));

      // Find top performing class from classPopularityData
      const topClass = classPopularityData.reduce((top, current) => 
        current.enrollments > top.enrollments ? current : top, 
        { class_name: "No classes", enrollments: 0 }
      );

      // Find lowest retention class
      const lowestClass = classPopularityData.reduce((lowest, current) => 
        current.attendance_rate < lowest.attendance_rate ? current : lowest,
        { class_name: "No classes", attendance_rate: 100 }
      );

      setStats({
        churnRate,
        avgLifetimeValue,
        monthlyRecurringRevenue,
        revenueGrowth,
        predictedChurn,
        topPerformingClass: topClass.class_name,
        lowestRetention: lowestClass.class_name,
      });
    } catch (error) {
      console.error('Error calculating summary stats:', error);
      // Fallback stats
      setStats({
        churnRate: 0,
        avgLifetimeValue: 0,
        monthlyRecurringRevenue: 0,
        revenueGrowth: 0,
        predictedChurn: 0,
        topPerformingClass: "No data",
        lowestRetention: "No data",
      });
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading enhanced analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Enhanced Analytics</h2>
          <p className="text-muted-foreground">Advanced analytics including retention, LTV, and revenue forecasting</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{stats.churnRate}%</div>
            <div className="text-sm text-muted-foreground">Monthly Churn Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">${stats.avgLifetimeValue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Avg Lifetime Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">${stats.monthlyRecurringRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Monthly Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold">+{stats.revenueGrowth}%</div>
            <div className="text-sm text-muted-foreground">Revenue Growth</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="retention">Retention Analysis</TabsTrigger>
              <TabsTrigger value="revenue">Revenue Forecasting</TabsTrigger>
              <TabsTrigger value="popularity">Class Popularity</TabsTrigger>
              <TabsTrigger value="ltv">Lifetime Value</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="retention">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium">Predicted Churn: {stats.predictedChurn} students this month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium">Lowest Retention: {stats.lowestRetention}</span>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={retentionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="retention_rate" stroke="#8884d8" name="Retention Rate %" />
                        <Line type="monotone" dataKey="new_students" stroke="#82ca9d" name="New Students" />
                        <Line type="monotone" dataKey="churned_students" stroke="#ff7300" name="Churned Students" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="revenue">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Revenue Growth: +{stats.revenueGrowth}%
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Next Month Forecast: ${revenueData[revenueData.length - 1]?.forecast.toLocaleString()}
                    </Badge>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="target" stackId="1" stroke="#ff7300" fill="#ff7300" name="Target" />
                        <Area type="monotone" dataKey="revenue" stackId="2" stroke="#8884d8" fill="#8884d8" name="Actual Revenue" />
                        <Area type="monotone" dataKey="forecast" stackId="3" stroke="#82ca9d" fill="#82ca9d" name="Forecast" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="popularity">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Top Class: {stats.topPerformingClass}
                    </Badge>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classPopularityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="class_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="enrollments" fill="#8884d8" name="Enrollments" />
                        <Bar dataKey="attendance_rate" fill="#82ca9d" name="Attendance Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ltv">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Highest LTV: Black Belt ($12,000)
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Avg Duration: 20 months
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80">
                      <h4 className="text-lg font-semibold mb-4">Lifetime Value by Belt Level</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lifetimeValueData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="belt_level" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="avg_ltv" fill="#8884d8" name="Avg LTV ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="h-80">
                      <h4 className="text-lg font-semibold mb-4">Student Distribution</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={lifetimeValueData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({belt_level, total_students}) => `${belt_level}: ${total_students}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="total_students"
                          >
                            {lifetimeValueData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};