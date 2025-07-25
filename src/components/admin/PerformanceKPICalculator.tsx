import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target, Users, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KPIData {
  currentRetention3Months: number;
  currentRetention6Months: number;
  currentCapacityAdults: number;
  currentCapacityYouth: number;
  currentRevenueMonthly: number;
  currentRevenueQuarterly: number;
  totalActiveStudents: number;
  totalClasses: number;
  averageAttendanceRate: number;
}

interface PerformanceTargets {
  retention_3_months: number;
  retention_6_months: number;
  retention_9_months: number;
  retention_12_months: number;
  capacity_adults: number;
  capacity_youth: number;
  capacity_first_30_days: number;
  capacity_after_30_days: number;
  revenue_monthly: number;
  revenue_quarterly: number;
  revenue_half_yearly: number;
  revenue_yearly: number;
}

export const PerformanceKPICalculator = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [targets, setTargets] = useState<PerformanceTargets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateKPIs();
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_targets')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setTargets(data);
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const calculateKPIs = async () => {
    try {
      // Calculate current retention rates
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Get total students who started 3+ months ago
      const { data: studentsThreeMonthsAgo } = await supabase
        .from('profiles')
        .select('id, membership_status')
        .lt('created_at', threeMonthsAgo.toISOString());

      // Get total students who started 6+ months ago
      const { data: studentsSixMonthsAgo } = await supabase
        .from('profiles')
        .select('id, membership_status')
        .lt('created_at', sixMonthsAgo.toISOString());

      // Calculate retention rates
      const activeThreeMonths = studentsThreeMonthsAgo?.filter(s => s.membership_status === 'active').length || 0;
      const totalThreeMonths = studentsThreeMonthsAgo?.length || 1;
      const currentRetention3Months = (activeThreeMonths / totalThreeMonths) * 100;

      const activeSixMonths = studentsSixMonthsAgo?.filter(s => s.membership_status === 'active').length || 0;
      const totalSixMonths = studentsSixMonthsAgo?.length || 1;
      const currentRetention6Months = (activeSixMonths / totalSixMonths) * 100;

      // Get class capacity data
      const { data: classData } = await supabase
        .from('classes')
        .select(`
          id,
          max_students,
          age_group,
          class_reservations(count)
        `)
        .eq('is_active', true);

      // Calculate capacity utilization
      let totalAdultCapacity = 0;
      let totalAdultEnrolled = 0;
      let totalYouthCapacity = 0;
      let totalYouthEnrolled = 0;

      classData?.forEach(classItem => {
        const enrolled = classItem.class_reservations?.[0]?.count || 0;
        if (classItem.age_group === 'adults') {
          totalAdultCapacity += classItem.max_students;
          totalAdultEnrolled += enrolled;
        } else {
          totalYouthCapacity += classItem.max_students;
          totalYouthEnrolled += enrolled;
        }
      });

      const currentCapacityAdults = totalAdultCapacity > 0 ? (totalAdultEnrolled / totalAdultCapacity) * 100 : 0;
      const currentCapacityYouth = totalYouthCapacity > 0 ? (totalYouthEnrolled / totalYouthCapacity) * 100 : 0;

      // Get revenue data for current month and quarter
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const startOfQuarter = new Date(currentMonth.getFullYear(), Math.floor(currentMonth.getMonth() / 3) * 3, 1);

      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', startOfMonth.toISOString().split('T')[0]);

      const { data: quarterlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', startOfQuarter.toISOString().split('T')[0]);

      const currentRevenueMonthly = monthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const currentRevenueQuarterly = quarterlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      // Get total active students and classes
      const { data: activeStudents } = await supabase
        .from('profiles')
        .select('id')
        .eq('membership_status', 'active')
        .eq('role', 'student');

      const { data: activeClasses } = await supabase
        .from('classes')
        .select('id')
        .eq('is_active', true);

      // Calculate average attendance rate
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      const totalAttendance = attendanceData?.length || 0;
      const presentAttendance = attendanceData?.filter(a => a.status === 'present').length || 0;
      const averageAttendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

      setKpiData({
        currentRetention3Months,
        currentRetention6Months,
        currentCapacityAdults,
        currentCapacityYouth,
        currentRevenueMonthly,
        currentRevenueQuarterly,
        totalActiveStudents: activeStudents?.length || 0,
        totalClasses: activeClasses?.length || 0,
        averageAttendanceRate
      });

    } catch (error) {
      console.error('Error calculating KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceStatus = (current: number, target: number, isReverse = false) => {
    const percentage = (current / target) * 100;
    if (isReverse) {
      // For metrics where lower is better
      if (percentage <= 80) return { status: 'excellent', color: 'text-green-600', icon: TrendingUp };
      if (percentage <= 100) return { status: 'good', color: 'text-blue-600', icon: TrendingUp };
      if (percentage <= 120) return { status: 'warning', color: 'text-yellow-600', icon: TrendingDown };
      return { status: 'poor', color: 'text-red-600', icon: TrendingDown };
    } else {
      // For metrics where higher is better
      if (percentage >= 100) return { status: 'excellent', color: 'text-green-600', icon: TrendingUp };
      if (percentage >= 80) return { status: 'good', color: 'text-blue-600', icon: TrendingUp };
      if (percentage >= 60) return { status: 'warning', color: 'text-yellow-600', icon: TrendingDown };
      return { status: 'poor', color: 'text-red-600', icon: TrendingDown };
    }
  };

  if (loading) {
    return <div>Loading KPI calculations...</div>;
  }

  if (!kpiData || !targets) {
    return <div>Unable to load performance data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalActiveStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across {kpiData.totalClasses} active classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.averageAttendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(kpiData.currentRevenueMonthly / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Target: ${(targets.revenue_monthly / 100).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="retention" className="space-y-4">
        <TabsList>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="retention">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  3-Month Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {kpiData.currentRetention3Months.toFixed(1)}%
                    </span>
                    <Badge variant={
                      getPerformanceStatus(kpiData.currentRetention3Months, targets.retention_3_months).status === 'excellent' ? 'default' :
                      getPerformanceStatus(kpiData.currentRetention3Months, targets.retention_3_months).status === 'good' ? 'secondary' :
                      getPerformanceStatus(kpiData.currentRetention3Months, targets.retention_3_months).status === 'warning' ? 'outline' : 'destructive'
                    }>
                      {getPerformanceStatus(kpiData.currentRetention3Months, targets.retention_3_months).status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(kpiData.currentRetention3Months / targets.retention_3_months) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Target: {targets.retention_3_months}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  6-Month Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {kpiData.currentRetention6Months.toFixed(1)}%
                    </span>
                    <Badge variant={
                      getPerformanceStatus(kpiData.currentRetention6Months, targets.retention_6_months).status === 'excellent' ? 'default' :
                      getPerformanceStatus(kpiData.currentRetention6Months, targets.retention_6_months).status === 'good' ? 'secondary' :
                      getPerformanceStatus(kpiData.currentRetention6Months, targets.retention_6_months).status === 'warning' ? 'outline' : 'destructive'
                    }>
                      {getPerformanceStatus(kpiData.currentRetention6Months, targets.retention_6_months).status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(kpiData.currentRetention6Months / targets.retention_6_months) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Target: {targets.retention_6_months}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capacity">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Adult Classes Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {kpiData.currentCapacityAdults.toFixed(1)}%
                    </span>
                    <Badge variant={
                      getPerformanceStatus(kpiData.currentCapacityAdults, targets.capacity_adults).status === 'excellent' ? 'default' :
                      getPerformanceStatus(kpiData.currentCapacityAdults, targets.capacity_adults).status === 'good' ? 'secondary' :
                      getPerformanceStatus(kpiData.currentCapacityAdults, targets.capacity_adults).status === 'warning' ? 'outline' : 'destructive'
                    }>
                      {getPerformanceStatus(kpiData.currentCapacityAdults, targets.capacity_adults).status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(kpiData.currentCapacityAdults / targets.capacity_adults) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Target: {targets.capacity_adults}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Youth Classes Capacity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {kpiData.currentCapacityYouth.toFixed(1)}%
                    </span>
                    <Badge variant={
                      getPerformanceStatus(kpiData.currentCapacityYouth, targets.capacity_youth).status === 'excellent' ? 'default' :
                      getPerformanceStatus(kpiData.currentCapacityYouth, targets.capacity_youth).status === 'good' ? 'secondary' :
                      getPerformanceStatus(kpiData.currentCapacityYouth, targets.capacity_youth).status === 'warning' ? 'outline' : 'destructive'
                    }>
                      {getPerformanceStatus(kpiData.currentCapacityYouth, targets.capacity_youth).status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(kpiData.currentCapacityYouth / targets.capacity_youth) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Target: {targets.capacity_youth}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${(kpiData.currentRevenueMonthly / 100).toLocaleString()}
                    </span>
                    <Badge variant={
                      getPerformanceStatus(kpiData.currentRevenueMonthly, targets.revenue_monthly).status === 'excellent' ? 'default' :
                      getPerformanceStatus(kpiData.currentRevenueMonthly, targets.revenue_monthly).status === 'good' ? 'secondary' :
                      getPerformanceStatus(kpiData.currentRevenueMonthly, targets.revenue_monthly).status === 'warning' ? 'outline' : 'destructive'
                    }>
                      {getPerformanceStatus(kpiData.currentRevenueMonthly, targets.revenue_monthly).status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(kpiData.currentRevenueMonthly / targets.revenue_monthly) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Target: ${(targets.revenue_monthly / 100).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quarterly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${(kpiData.currentRevenueQuarterly / 100).toLocaleString()}
                    </span>
                    <Badge variant={
                      getPerformanceStatus(kpiData.currentRevenueQuarterly, targets.revenue_quarterly).status === 'excellent' ? 'default' :
                      getPerformanceStatus(kpiData.currentRevenueQuarterly, targets.revenue_quarterly).status === 'good' ? 'secondary' :
                      getPerformanceStatus(kpiData.currentRevenueQuarterly, targets.revenue_quarterly).status === 'warning' ? 'outline' : 'destructive'
                    }>
                      {getPerformanceStatus(kpiData.currentRevenueQuarterly, targets.revenue_quarterly).status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(kpiData.currentRevenueQuarterly / targets.revenue_quarterly) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    Target: ${(targets.revenue_quarterly / 100).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};