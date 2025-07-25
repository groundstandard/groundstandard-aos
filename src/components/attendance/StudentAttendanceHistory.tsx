import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Award,
  Target,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

// ABOUTME: Student Attendance History - Comprehensive attendance tracking and analytics for students

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  class_id: string;
  class_name: string;
  instructor_name: string;
  created_at: string;
}

interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  currentStreak: number;
  longestStreak: number;
  classBreakdown: Array<{
    class_id: string;
    class_name: string;
    instructor_name: string;
    total_sessions: number;
    attendance_rate: number;
    present_count: number;
    absent_count: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    attendance_rate: number;
    total_sessions: number;
  }>;
  monthlyGoal: {
    target: number;
    current: number;
    percentage: number;
  };
}

type DateRange = {
  from: Date;
  to: Date;
};

export const StudentAttendanceHistory = () => {
  const { profile } = useAuth();
  const { currentAcademyId } = useAcademy();
  const { toast } = useToast();
  
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string; name: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && currentAcademyId) {
      fetchAttendanceData();
    }
  }, [profile, currentAcademyId, dateRange, classFilter, statusFilter]);

  const fetchAttendanceData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Fetch attendance records with class details
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          classes!attendance_class_id_fkey(
            name,
            instructor_id,
            profiles!classes_instructor_id_fkey(first_name, last_name)
          )
        `)
        .eq('student_id', profile.id)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Transform data
      const transformedRecords: AttendanceRecord[] = (attendance || []).map(record => ({
        id: record.id,
        date: record.date,
        status: record.status as 'present' | 'absent' | 'late' | 'excused',
        notes: record.notes,
        class_id: record.class_id,
        class_name: record.classes?.name || 'Unknown Class',
        instructor_name: record.classes?.profiles 
          ? `${record.classes.profiles.first_name} ${record.classes.profiles.last_name}`
          : 'Unknown Instructor',
        created_at: record.created_at
      }));

      // Filter records
      const filteredRecords = transformedRecords.filter(record => {
        const matchesClass = classFilter === 'all' || record.class_id === classFilter;
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        return matchesClass && matchesStatus;
      });

      setAttendanceRecords(filteredRecords);

      // Calculate statistics
      const stats = calculateAttendanceStats(filteredRecords);
      setAttendanceStats(stats);

      // Extract unique classes
      const uniqueClasses = Array.from(
        new Map(transformedRecords.map(record => [record.class_id, {
          id: record.class_id,
          name: record.class_name
        }])).values()
      );
      setAvailableClasses(uniqueClasses);

    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch attendance data'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAttendanceStats = (records: AttendanceRecord[]): AttendanceStats => {
    const totalSessions = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const excusedCount = records.filter(r => r.status === 'excused').length;
    
    const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

    // Calculate current and longest streaks
    const sortedRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    sortedRecords.forEach((record, index) => {
      if (record.status === 'present') {
        tempStreak++;
        if (index === 0) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (index === 0) currentStreak = 0;
        tempStreak = 0;
      }
    });

    // Class breakdown
    const classBreakdownMap: Record<string, any> = {};
    records.forEach(record => {
      const classId = record.class_id;
      if (!classBreakdownMap[classId]) {
        classBreakdownMap[classId] = {
          class_id: classId,
          class_name: record.class_name,
          instructor_name: record.instructor_name,
          total_sessions: 0,
          present_count: 0,
          absent_count: 0
        };
      }
      classBreakdownMap[classId].total_sessions++;
      if (record.status === 'present') classBreakdownMap[classId].present_count++;
      if (record.status === 'absent') classBreakdownMap[classId].absent_count++;
    });

    const classBreakdown = Object.values(classBreakdownMap).map((cls: any) => ({
      ...cls,
      attendance_rate: cls.total_sessions > 0 
        ? Math.round((cls.present_count / cls.total_sessions) * 100) 
        : 0
    }));

    // Weekly trend (simplified)
    const weeklyTrend: Array<{week: string; attendance_rate: number; total_sessions: number}> = [];
    const weeks = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (7 * 24 * 60 * 60 * 1000));
    
    for (let i = 0; i < Math.min(weeks, 8); i++) {
      const weekStart = new Date(dateRange.from.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
      
      const weekRecords = records.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      const weekPresent = weekRecords.filter(r => r.status === 'present').length;
      const weekTotal = weekRecords.length;
      
      weeklyTrend.push({
        week: format(weekStart, 'MMM dd'),
        attendance_rate: weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0,
        total_sessions: weekTotal
      });
    }

    // Monthly goal (80% attendance target)
    const monthlyGoal = {
      target: 80,
      current: attendanceRate,
      percentage: Math.min((attendanceRate / 80) * 100, 100)
    };

    return {
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate,
      currentStreak,
      longestStreak,
      classBreakdown,
      weeklyTrend,
      monthlyGoal
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'excused':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const exportAttendanceData = () => {
    const csv = [
      ['Date', 'Class', 'Instructor', 'Status', 'Notes'],
      ...attendanceRecords.map(record => [
        record.date,
        record.class_name,
        record.instructor_name,
        record.status,
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your attendance history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to 
                    ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                    : "Select date range"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {availableClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDateRange({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })}
              >
                This Week
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}
              >
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {attendanceStats && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="classes">By Class</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{attendanceStats.attendanceRate}%</div>
                  <p className="text-sm text-muted-foreground">Attendance Rate</p>
                  <div className="flex items-center justify-center mt-2">
                    {attendanceStats.attendanceRate >= 80 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{attendanceStats.currentStreak}</div>
                  <p className="text-sm text-muted-foreground">Current Streak</p>
                  <Award className="h-4 w-4 mx-auto mt-2 text-yellow-500" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{attendanceStats.longestStreak}</div>
                  <p className="text-sm text-muted-foreground">Longest Streak</p>
                  <Target className="h-4 w-4 mx-auto mt-2 text-blue-500" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{attendanceStats.totalSessions}</div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                  <BarChart3 className="h-4 w-4 mx-auto mt-2 text-purple-500" />
                </CardContent>
              </Card>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <div className="text-xl font-bold">{attendanceStats.presentCount}</div>
                  <p className="text-sm text-muted-foreground">Present</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
                  <div className="text-xl font-bold">{attendanceStats.absentCount}</div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                  <div className="text-xl font-bold">{attendanceStats.lateCount}</div>
                  <p className="text-sm text-muted-foreground">Late</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <div className="text-xl font-bold">{attendanceStats.excusedCount}</div>
                  <p className="text-sm text-muted-foreground">Excused</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attendance records found for the selected period.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceRecords.map(record => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-smooth"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(record.status)}
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">{record.class_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {record.instructor_name} • {format(new Date(record.date), 'MMM d, yyyy')}
                            </p>
                            {record.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {record.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(record.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Class</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceStats.classBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No class data available for the selected period.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attendanceStats.classBreakdown.map(classData => (
                      <Card key={classData.class_id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{classData.class_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Instructor: {classData.instructor_name}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-lg font-semibold">
                              {classData.attendance_rate}%
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold">{classData.total_sessions}</p>
                              <p className="text-xs text-muted-foreground">Total Sessions</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{classData.present_count}</p>
                              <p className="text-xs text-muted-foreground">Present</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-red-600">{classData.absent_count}</p>
                              <p className="text-xs text-muted-foreground">Absent</p>
                            </div>
                          </div>
                          
                          <Progress 
                            value={classData.attendance_rate} 
                            className="mt-3"
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Attendance Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Target: 80% Attendance</span>
                    <span className="text-2xl font-bold">
                      {attendanceStats.monthlyGoal.current}%
                    </span>
                  </div>
                  
                  <Progress 
                    value={attendanceStats.monthlyGoal.percentage}
                    className="h-3"
                  />
                  
                  <div className="text-center">
                    {attendanceStats.monthlyGoal.current >= attendanceStats.monthlyGoal.target ? (
                      <div className="text-green-600 font-semibold flex items-center justify-center gap-2">
                        <Award className="h-5 w-5" />
                        Goal Achieved! Keep it up!
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        {attendanceStats.monthlyGoal.target - attendanceStats.monthlyGoal.current}% more to reach your goal
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={cn(
                    "p-4 border rounded-lg text-center",
                    attendanceStats.currentStreak >= 5 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50"
                  )}>
                    <Award className={cn(
                      "h-8 w-8 mx-auto mb-2",
                      attendanceStats.currentStreak >= 5 ? "text-yellow-500" : "text-gray-400"
                    )} />
                    <p className="text-sm font-medium">5-Day Streak</p>
                    <p className="text-xs text-muted-foreground">
                      {attendanceStats.currentStreak >= 5 ? "Unlocked!" : "Keep going!"}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 border rounded-lg text-center",
                    attendanceStats.attendanceRate >= 90 ? "bg-green-50 border-green-200" : "bg-gray-50"
                  )}>
                    <Target className={cn(
                      "h-8 w-8 mx-auto mb-2",
                      attendanceStats.attendanceRate >= 90 ? "text-green-500" : "text-gray-400"
                    )} />
                    <p className="text-sm font-medium">Perfect Attendance</p>
                    <p className="text-xs text-muted-foreground">
                      {attendanceStats.attendanceRate >= 90 ? "Unlocked!" : "90% attendance needed"}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 border rounded-lg text-center",
                    attendanceStats.totalSessions >= 20 ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                  )}>
                    <BarChart3 className={cn(
                      "h-8 w-8 mx-auto mb-2",
                      attendanceStats.totalSessions >= 20 ? "text-blue-500" : "text-gray-400"
                    )} />
                    <p className="text-sm font-medium">Regular Student</p>
                    <p className="text-xs text-muted-foreground">
                      {attendanceStats.totalSessions >= 20 ? "Unlocked!" : "20 sessions needed"}
                    </p>
                  </div>

                  <div className={cn(
                    "p-4 border rounded-lg text-center",
                    attendanceStats.longestStreak >= 10 ? "bg-purple-50 border-purple-200" : "bg-gray-50"
                  )}>
                    <CheckCircle className={cn(
                      "h-8 w-8 mx-auto mb-2",
                      attendanceStats.longestStreak >= 10 ? "text-purple-500" : "text-gray-400"
                    )} />
                    <p className="text-sm font-medium">Dedicated</p>
                    <p className="text-xs text-muted-foreground">
                      {attendanceStats.longestStreak >= 10 ? "Unlocked!" : "10-day streak needed"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};