import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, Award } from "lucide-react";
import { format, subMonths } from "date-fns";

export const StudentReports = () => {
  const isMobile = useIsMobile();
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-reports'],
    queryFn: async () => {
      // Get all students with profile info
      const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'member')
        .order('created_at', { ascending: false });

      // Get enrollment data
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select(`
          *,
          classes(name),
          profiles(first_name, last_name)
        `);

      // Get recent attendance for each student (last 3 months)
      const threeMonthsAgo = subMonths(new Date(), 3);
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .gte('date', format(threeMonthsAgo, 'yyyy-MM-dd'));

      // Calculate student statistics
      const studentStats = students?.map(student => {
        const studentEnrollments = enrollments?.filter(e => e.student_id === student.id) || [];
        const studentAttendance = recentAttendance?.filter(a => a.student_id === student.id) || [];
        
        const totalSessions = studentAttendance.length;
        const presentSessions = studentAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

        return {
          ...student,
          enrolledClasses: studentEnrollments.length,
          recentAttendanceRate: attendanceRate,
          totalRecentSessions: totalSessions,
          joinDate: student.created_at
        };
      });

      // Summary statistics
      const totalStudents = students?.length || 0;
      const activeStudents = students?.filter(s => s.membership_status === 'active').length || 0;
      const inactiveStudents = students?.filter(s => s.membership_status === 'inactive').length || 0;
      const alumniStudents = students?.filter(s => s.membership_status === 'alumni').length || 0;

      // Belt level distribution
      const beltDistribution = students?.reduce((acc: Record<string, number>, student) => {
        const belt = student.belt_level || 'No Belt';
        acc[belt] = (acc[belt] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        students: studentStats || [],
        summary: {
          totalStudents,
          activeStudents,
          inactiveStudents,
          alumniStudents
        },
        beltDistribution
      };
    }
  });

  if (isLoading) {
    return <div>Loading student reports...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Summary Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{studentData?.summary.totalStudents || 0}</div>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate`}>All registered members</p>
          </CardContent>
        </Card>

        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Active Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>{studentData?.summary.activeStudents || 0}</div>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate`}>Currently training</p>
          </CardContent>
        </Card>

        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Inactive Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-orange-600`}>{studentData?.summary.inactiveStudents || 0}</div>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate`}>Temporarily inactive</p>
          </CardContent>
        </Card>

        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Alumni</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{studentData?.summary.alumniStudents || 0}</div>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground truncate`}>Former members</p>
          </CardContent>
        </Card>
      </div>

      {/* Belt Distribution */}
      <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
            <span className={isMobile ? 'text-base' : ''}>Belt Level Distribution</span>
            {!isMobile && (
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
          </CardTitle>
          <CardDescription className={isMobile ? 'text-sm' : ''}>
            Current belt levels across all students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-4'}`}>
            {Object.entries(studentData?.beltDistribution || {}).map(([belt, count]) => (
              <div key={belt} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg min-w-0">
                <span className={`font-medium truncate ${isMobile ? 'text-sm' : ''}`}>{belt}</span>
                <Badge variant="secondary" className={`${isMobile ? 'text-xs' : ''} flex-shrink-0 ml-2`}>{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Student List */}
      <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className={isMobile ? 'text-base' : ''}>Detailed Student Analysis</CardTitle>
          <CardDescription className={isMobile ? 'text-sm' : ''}>
            Individual student profiles with attendance and enrollment data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Name</TableHead>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[100px]">Belt Level</TableHead>
                    <TableHead className="w-[60px]">Classes</TableHead>
                    <TableHead className="w-[120px]">Attendance (3mo)</TableHead>
                    <TableHead className="w-[100px]">Join Date</TableHead>
                    <TableHead className="w-[180px]">Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData?.students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium truncate">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            student.membership_status === 'active' ? 'default' :
                            student.membership_status === 'inactive' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {student.membership_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{student.belt_level || 'No Belt'}</Badge>
                      </TableCell>
                      <TableCell>{student.enrolledClasses}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge 
                            variant={
                              student.recentAttendanceRate >= 80 ? 'default' :
                              student.recentAttendanceRate >= 60 ? 'secondary' : 'destructive'
                            }
                            className="text-xs mb-1"
                          >
                            {student.recentAttendanceRate}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({student.totalRecentSessions} sessions)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(student.joinDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-[180px]">
                          <div className="truncate">{student.email}</div>
                          {student.phone && (
                            <div className="text-muted-foreground truncate">{student.phone}</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!studentData?.students || studentData.students.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};