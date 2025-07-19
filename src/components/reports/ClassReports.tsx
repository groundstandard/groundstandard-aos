import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { format, subMonths } from "date-fns";

export const ClassReports = () => {
  const { data: classData, isLoading } = useQuery({
    queryKey: ['class-reports'],
    queryFn: async () => {
      // Get all classes with schedules
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          *,
          class_schedules(day_of_week, start_time, end_time)
        `)
        .order('created_at', { ascending: false });

      // Get enrollments per class
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select(`
          class_id,
          status,
          profiles(first_name, last_name, belt_level)
        `);

      // Get attendance data for last 3 months
      const threeMonthsAgo = subMonths(new Date(), 3);
      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          class_id,
          status,
          date
        `)
        .gte('date', format(threeMonthsAgo, 'yyyy-MM-dd'));

      // Calculate class statistics
      const classStats = classes?.map(classItem => {
        const classEnrollments = enrollments?.filter(e => e.class_id === classItem.id) || [];
        const activeEnrollments = classEnrollments.filter(e => e.status === 'active');
        const classAttendance = attendance?.filter(a => a.class_id === classItem.id) || [];
        
        const totalSessions = classAttendance.length;
        const presentSessions = classAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
        
        // Calculate capacity utilization
        const capacityUtilization = classItem.max_students > 0 
          ? Math.round((activeEnrollments.length / classItem.max_students) * 100) 
          : 0;

        return {
          ...classItem,
          totalEnrolled: classEnrollments.length,
          activeEnrolled: activeEnrollments.length,
          attendanceRate,
          totalSessions,
          capacityUtilization,
          scheduleCount: classItem.class_schedules?.length || 0
        };
      });

      // Summary statistics
      const totalClasses = classes?.length || 0;
      const activeClasses = classes?.filter(c => c.is_active).length || 0;
      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;

      return {
        classes: classStats || [],
        summary: {
          totalClasses,
          activeClasses,
          totalEnrollments,
          activeEnrollments
        }
      };
    }
  });

  const getDayName = (dayNumber: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber] || 'Unknown';
  };

  if (isLoading) {
    return <div>Loading class reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData?.summary.totalClasses || 0}</div>
            <p className="text-xs text-muted-foreground">All created classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{classData?.summary.activeClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData?.summary.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">All time enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{classData?.summary.activeEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">Current students</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Class Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Class Performance Analysis</span>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardTitle>
          <CardDescription>
            Detailed analytics for each class including enrollment and attendance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>Enrolled / Capacity</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Attendance Rate</TableHead>
                <TableHead>Sessions (3mo)</TableHead>
                <TableHead>Schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classData?.classes.map((classItem: any) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{classItem.name}</div>
                      {classItem.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {classItem.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                      {classItem.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{classItem.skill_level || 'All'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {classItem.activeEnrolled} / {classItem.max_students || 'Unlimited'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {classItem.totalEnrolled} total enrolled
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        classItem.capacityUtilization >= 90 ? 'destructive' :
                        classItem.capacityUtilization >= 70 ? 'default' : 'secondary'
                      }
                    >
                      {classItem.capacityUtilization}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        classItem.attendanceRate >= 80 ? 'default' :
                        classItem.attendanceRate >= 60 ? 'secondary' : 'destructive'
                      }
                    >
                      {classItem.attendanceRate}%
                    </Badge>
                  </TableCell>
                  <TableCell>{classItem.totalSessions}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {classItem.class_schedules?.map((schedule: any, index: number) => (
                        <div key={index} className="text-xs">
                          {getDayName(schedule.day_of_week)} {schedule.start_time}
                        </div>
                      )) || 'No schedule'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!classData?.classes || classData.classes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No classes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Class Performance Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Classes</CardTitle>
            <CardDescription>Classes with highest attendance rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classData?.classes
                .filter((c: any) => c.is_active && c.totalSessions > 0)
                .sort((a: any, b: any) => b.attendanceRate - a.attendanceRate)
                .slice(0, 5)
                .map((classItem: any, index: number) => (
                  <div key={classItem.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium text-sm">{classItem.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {classItem.activeEnrolled} students
                      </div>
                    </div>
                    <Badge variant="default">{classItem.attendanceRate}%</Badge>
                  </div>
                )) || <p className="text-muted-foreground">No active classes with attendance data</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Analysis</CardTitle>
            <CardDescription>Classes by capacity utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classData?.classes
                .filter((c: any) => c.is_active && c.max_students)
                .sort((a: any, b: any) => b.capacityUtilization - a.capacityUtilization)
                .slice(0, 5)
                .map((classItem: any) => (
                  <div key={classItem.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium text-sm">{classItem.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {classItem.activeEnrolled}/{classItem.max_students} capacity
                      </div>
                    </div>
                    <Badge 
                      variant={
                        classItem.capacityUtilization >= 90 ? 'destructive' :
                        classItem.capacityUtilization >= 70 ? 'default' : 'secondary'
                      }
                    >
                      {classItem.capacityUtilization}%
                    </Badge>
                  </div>
                )) || <p className="text-muted-foreground">No classes with capacity limits</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};