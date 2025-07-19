import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  notes?: string;
  classes: {
    name: string;
  };
}

interface EnrolledClass {
  id: string;
  name: string;
  class_schedules: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[];
}

const Attendance = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch attendance records for the current user
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          classes (
            name
          )
        `)
        .eq('student_id', user?.id)
        .order('date', { ascending: false })
        .limit(50);

      if (attendanceError) throw attendanceError;

      // Fetch enrolled classes
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select(`
          classes (
            id,
            name,
            class_schedules (
              day_of_week,
              start_time,
              end_time
            )
          )
        `)
        .eq('student_id', user?.id)
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;

      setAttendanceRecords((attendanceData || []) as AttendanceRecord[]);
      setEnrolledClasses((enrollmentsData?.map(e => e.classes).filter(Boolean) || []) as EnrolledClass[]);
    } catch (error: any) {
      console.error('Error fetching attendance data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load attendance data"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'excused':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'excused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAttendanceRate = () => {
    if (attendanceRecords.length === 0) return 0;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    return Math.round((presentCount / attendanceRecords.length) * 100);
  };

  if (loading || loadingData) {
    return <div className="min-h-screen flex items-center justify-center">Loading attendance...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view attendance.</div>;
  }

  if (profile?.role !== 'student') {
    return <div className="min-h-screen flex items-center justify-center">This page is only available for students.</div>;
  }

  const attendanceRate = calculateAttendanceRate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Attendance</h1>
          <p className="text-muted-foreground">Track your class attendance and progress</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{attendanceRate}%</div>
              <p className="text-sm text-muted-foreground">
                {attendanceRecords.filter(r => r.status === 'present').length} of {attendanceRecords.length} classes attended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enrolled Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{enrolledClasses.length}</div>
              <p className="text-sm text-muted-foreground">Active enrollments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {attendanceRecords.filter(r => {
                  const recordDate = new Date(r.date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return recordDate >= weekAgo;
                }).length}
              </div>
              <p className="text-sm text-muted-foreground">Classes this week</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Classes</CardTitle>
              <CardDescription>Your current class enrollments</CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledClasses.length > 0 ? (
                <div className="space-y-4">
                  {enrolledClasses.map((classItem) => (
                    <div key={classItem.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{classItem.name}</h3>
                      <div className="space-y-1">
                        {classItem.class_schedules.map((schedule, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{dayNames[schedule.day_of_week]}</span>
                            <span>{schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No active enrollments</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Your attendance history</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length > 0 ? (
                <div className="space-y-3">
                  {attendanceRecords.slice(0, 10).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-medium">{record.classes.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                  {attendanceRecords.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {attendanceRecords.length - 10} more records...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No attendance records yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Attendance;