import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Target, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const OverviewReports = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['overview-stats'],
    queryFn: async () => {
      // Get total students
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('id, membership_status')
        .eq('role', 'member');

      // Get total classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id')
        .eq('is_active', true);

      // Get attendance for this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('id, status')
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      // Get belt level distribution
      const { data: beltData } = await supabase
        .from('profiles')
        .select('belt_level')
        .eq('role', 'member')
        .not('belt_level', 'is', null);

      return {
        totalStudents: studentsData?.length || 0,
        activeStudents: studentsData?.filter(s => s.membership_status === 'active').length || 0,
        totalClasses: classesData?.length || 0,
        monthlyAttendance: attendanceData?.length || 0,
        presentCount: attendanceData?.filter(a => a.status === 'present').length || 0,
        beltDistribution: beltData?.reduce((acc: Record<string, number>, curr) => {
          const belt = curr.belt_level || 'No Belt';
          acc[belt] = (acc[belt] || 0) + 1;
          return acc;
        }, {}) || {}
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const attendanceRate = stats?.monthlyAttendance 
    ? Math.round((stats.presentCount / stats.monthlyAttendance) * 100)
    : 0;

  const retentionRate = stats?.totalStudents 
    ? Math.round((stats.activeStudents / stats.totalStudents) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mr-1">
                {stats?.activeStudents || 0} active
              </Badge>
              current members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently scheduled classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {attendanceRate >= 80 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {retentionRate >= 90 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              Active members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Belt Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Belt Level Distribution</CardTitle>
          <CardDescription>
            Current belt levels across all active members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats?.beltDistribution || {}).map(([belt, count]) => (
              <Badge key={belt} variant="outline" className="flex items-center gap-1">
                {belt}: {count}
              </Badge>
            ))}
            {Object.keys(stats?.beltDistribution || {}).length === 0 && (
              <p className="text-muted-foreground">No belt data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
          <CardDescription>
            Key performance indicators at a glance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Monthly Attendance</p>
              <p className="text-sm text-muted-foreground">
                {stats?.presentCount || 0} out of {stats?.monthlyAttendance || 0} sessions
              </p>
            </div>
            <Badge variant={attendanceRate >= 80 ? "default" : "destructive"}>
              {attendanceRate}%
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Member Retention</p>
              <p className="text-sm text-muted-foreground">
                {stats?.activeStudents || 0} active of {stats?.totalStudents || 0} total
              </p>
            </div>
            <Badge variant={retentionRate >= 90 ? "default" : "secondary"}>
              {retentionRate}%
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};