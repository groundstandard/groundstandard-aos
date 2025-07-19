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
      await Promise.all([
        fetchRetentionAnalysis(),
        fetchRevenueForecasting(),
        fetchClassPopularity(),
        fetchLifetimeValue(),
        fetchSummaryStats()
      ]);
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
    // Simulate retention analysis data
    const mockData: RetentionData[] = [
      { month: "Jan", new_students: 25, retained_students: 180, churned_students: 12, retention_rate: 93.8 },
      { month: "Feb", new_students: 30, retained_students: 195, churned_students: 8, retention_rate: 96.1 },
      { month: "Mar", new_students: 22, retained_students: 205, churned_students: 15, retention_rate: 93.2 },
      { month: "Apr", new_students: 28, retained_students: 215, churned_students: 10, retention_rate: 95.6 },
      { month: "May", new_students: 35, retained_students: 235, churned_students: 18, retention_rate: 92.9 },
      { month: "Jun", new_students: 40, retained_students: 252, churned_students: 14, retention_rate: 94.7 },
    ];
    setRetentionData(mockData);
  };

  const fetchRevenueForecasting = async () => {
    // Simulate revenue forecasting data
    const mockData: RevenueData[] = [
      { month: "Jan", revenue: 15000, forecast: 15200, target: 16000 },
      { month: "Feb", revenue: 16200, forecast: 16500, target: 17000 },
      { month: "Mar", revenue: 14800, forecast: 15000, target: 16500 },
      { month: "Apr", revenue: 17500, forecast: 17800, target: 18000 },
      { month: "May", revenue: 18200, forecast: 18500, target: 19000 },
      { month: "Jun", revenue: 19100, forecast: 19500, target: 20000 },
    ];
    setRevenueData(mockData);
  };

  const fetchClassPopularity = async () => {
    // Simulate class popularity data  
    const mockData: ClassPopularityData[] = [
      { class_name: "Beginner Karate", enrollments: 45, attendance_rate: 92, satisfaction: 4.8 },
      { class_name: "Advanced Sparring", enrollments: 32, attendance_rate: 88, satisfaction: 4.6 },
      { class_name: "Kids Martial Arts", enrollments: 60, attendance_rate: 95, satisfaction: 4.9 },
      { class_name: "Self Defense", enrollments: 28, attendance_rate: 85, satisfaction: 4.4 },
      { class_name: "Competition Team", enrollments: 18, attendance_rate: 96, satisfaction: 4.7 },
    ];
    setClassPopularityData(mockData);
  };

  const fetchLifetimeValue = async () => {
    // Simulate lifetime value data
    const mockData: LifetimeValueData[] = [
      { belt_level: "White", avg_ltv: 2400, avg_duration_months: 8, total_students: 45 },
      { belt_level: "Yellow", avg_ltv: 3600, avg_duration_months: 12, total_students: 38 },
      { belt_level: "Orange", avg_ltv: 4800, avg_duration_months: 16, total_students: 32 },
      { belt_level: "Green", avg_ltv: 6000, avg_duration_months: 20, total_students: 28 },
      { belt_level: "Blue", avg_ltv: 7200, avg_duration_months: 24, total_students: 22 },
      { belt_level: "Brown", avg_ltv: 9600, avg_duration_months: 32, total_students: 15 },
      { belt_level: "Black", avg_ltv: 12000, avg_duration_months: 40, total_students: 8 },
    ];
    setLifetimeValueData(mockData);
  };

  const fetchSummaryStats = async () => {
    // Calculate summary statistics
    setStats({
      churnRate: 5.8,
      avgLifetimeValue: 5400,
      monthlyRecurringRevenue: 18500,
      revenueGrowth: 12.3,
      predictedChurn: 8,
      topPerformingClass: "Kids Martial Arts",
      lowestRetention: "Self Defense",
    });
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