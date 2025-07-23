import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CalendarIcon,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  BarChart3,
  PieChart,
  Calendar as CalendarDays
} from 'lucide-react';
import { CalendarAttendanceView } from '@/components/attendance/CalendarAttendanceView';
import { EnhancedCalendarView } from '@/components/calendar/EnhancedCalendarView';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useExport } from '@/hooks/useExport';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    belt_level?: string;
    role: string;
  };
  classes?: {
    name: string;
    instructor_id: string;
    instructor?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface AttendanceStats {
  totalStudents: number;
  totalSessions: number;
  averageAttendance: number;
  presentCount: number; // This will represent "Present Today"
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  classStats: Array<{
    class_id: string;
    class_name: string;
    instructor_name: string;
    total_sessions: number;
    attendance_rate: number;
    present_count: number;
    absent_count: number;
  }>;
  studentStats: Array<{
    student_id: string;
    student_name: string;
    belt_level: string;
    total_sessions: number;
    attendance_rate: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    risk_level: 'low' | 'medium' | 'high';
  }>;
  weeklyTrend: Array<{
    week: string;
    attendance_rate: number;
    total_sessions: number;
  }>;
}

type DateRange = {
  from: Date;
  to: Date;
};

export const AttendanceManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { exportData, loading: exportLoading } = useExport();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<string>('present');
  const [newAttendance, setNewAttendance] = useState({
    student_id: '',
    class_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present' as const,
    notes: ''
  });
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchValue, setStudentSearchValue] = useState('');

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.student-search-container')) {
        setStudentSearchOpen(false);
      }
    };

    if (studentSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [studentSearchOpen]);

  // Fetch comprehensive attendance data
  const { data: attendanceData, isLoading, refetch } = useQuery({
    queryKey: ['admin-attendance', dateRange, statusFilter, classFilter],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return null;

      // Fetch attendance records with full details
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles!attendance_student_id_fkey(
            first_name, 
            last_name, 
            email, 
            belt_level,
            role
          ),
          classes!attendance_class_id_fkey(
            name,
            instructor_id,
            profiles!classes_instructor_id_fkey(first_name, last_name)
          )
        `)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Calculate comprehensive statistics
      const totalSessions = attendance?.length || 0;
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
      const lateCount = attendance?.filter(a => a.status === 'late').length || 0;
      const excusedCount = attendance?.filter(a => a.status === 'excused').length || 0;
      
      // Calculate "Present Today" - only today's attendance
      const today = format(new Date(), 'yyyy-MM-dd');
      const presentToday = attendance?.filter(a => a.status === 'present' && a.date === today).length || 0;
      
      const uniqueStudents = new Set(attendance?.map(a => a.student_id)).size;
      const averageAttendance = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      // Class-level statistics
      const classStatsMap: Record<string, any> = {};
      attendance?.forEach(record => {
        const classId = record.class_id;
        if (!classStatsMap[classId]) {
          classStatsMap[classId] = {
            class_id: classId,
            class_name: record.classes?.name || 'Unknown Class',
            instructor_name: record.classes?.profiles 
              ? `${record.classes.profiles.first_name} ${record.classes.profiles.last_name}`
              : 'Unknown Instructor',
            total_sessions: 0,
            present_count: 0,
            absent_count: 0
          };
        }
        classStatsMap[classId].total_sessions++;
        if (record.status === 'present') classStatsMap[classId].present_count++;
        if (record.status === 'absent') classStatsMap[classId].absent_count++;
      });

      const classStats = Object.values(classStatsMap).map((cls: any) => ({
        ...cls,
        attendance_rate: cls.total_sessions > 0 
          ? Math.round((cls.present_count / cls.total_sessions) * 100) 
          : 0
      }));

      // Student-level statistics with risk assessment
      const studentStatsMap: Record<string, any> = {};
      attendance?.forEach(record => {
        const studentId = record.student_id;
        if (!studentStatsMap[studentId]) {
          studentStatsMap[studentId] = {
            student_id: studentId,
            student_name: record.profiles 
              ? `${record.profiles.first_name} ${record.profiles.last_name}`
              : 'Unknown Student',
            belt_level: record.profiles?.belt_level || 'No Belt',
            total_sessions: 0,
            present_count: 0,
            absent_count: 0,
            late_count: 0
          };
        }
        studentStatsMap[studentId].total_sessions++;
        if (record.status === 'present') studentStatsMap[studentId].present_count++;
        if (record.status === 'absent') studentStatsMap[studentId].absent_count++;
        if (record.status === 'late') studentStatsMap[studentId].late_count++;
      });

      const studentStats = Object.values(studentStatsMap).map((student: any) => {
        const attendanceRate = student.total_sessions > 0 
          ? Math.round((student.present_count / student.total_sessions) * 100) 
          : 0;
        
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (attendanceRate < 60) riskLevel = 'high';
        else if (attendanceRate < 80) riskLevel = 'medium';

        return {
          ...student,
          attendance_rate: attendanceRate,
          risk_level: riskLevel
        };
      });

      // Weekly trend calculation
      const weeklyTrend: Array<{ week: string; attendance_rate: number; total_sessions: number }> = [];
      const weeks = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(dateRange.from.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
        const weekEnd = new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
        
        const weekAttendance = attendance?.filter(a => {
          const recordDate = new Date(a.date);
          return recordDate >= weekStart && recordDate <= weekEnd;
        }) || [];
        
        const weekPresent = weekAttendance.filter(a => a.status === 'present').length;
        const weekTotal = weekAttendance.length;
        
        weeklyTrend.push({
          week: format(weekStart, 'MMM dd'),
          attendance_rate: weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0,
          total_sessions: weekTotal
        });
      }

      const stats: AttendanceStats = {
        totalStudents: uniqueStudents,
        totalSessions,
        averageAttendance,
        presentCount: presentToday, // Use presentToday for the "Present Today" metric
        absentCount,
        lateCount,
        excusedCount,
        classStats,
        studentStats,
        weeklyTrend
      };

      return {
        attendance: attendance || [],
        stats
      };
    }
  });

  // Fetch students and classes for dropdowns
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, phone, belt_level, role')
        .in('role', ['student', 'member'])
        .eq('membership_status', 'active')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Handle marking new attendance
  const handleMarkAttendance = async () => {
    if (!newAttendance.student_id || !newAttendance.class_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select both student and class'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: newAttendance.student_id,
          class_id: newAttendance.class_id,
          date: newAttendance.date,
          status: newAttendance.status,
          notes: newAttendance.notes || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance marked successfully'
      });

      setShowMarkDialog(false);
      setNewAttendance({
        student_id: '',
        class_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'present',
        notes: ''
      });
      refetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark attendance'
      });
    }
  };

  // Handle attendance record updates
  const handleUpdateAttendance = async () => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from('attendance')
        .update({
          status: editStatus,
          notes: editNotes || null
        })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance record updated successfully'
      });

      setShowEditDialog(false);
      setSelectedRecord(null);
      refetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update attendance record'
      });
    }
  };

  // Filter attendance records
  const filteredAttendance = attendanceData?.attendance.filter(record => {
    const matchesSearch = record.profiles 
      ? `${record.profiles.first_name} ${record.profiles.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesClass = classFilter === 'all' || record.class_id === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  }) || [];

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const configs = {
      present: { label: 'Present', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      absent: { label: 'Absent', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      late: { label: 'Late', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      excused: { label: 'Excused', variant: 'outline' as const, className: 'bg-blue-100 text-blue-800' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.present;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: 'low' | 'medium' | 'high') => {
    const configs = {
      low: { label: 'Low Risk', className: 'bg-green-100 text-green-800' },
      medium: { label: 'Medium Risk', className: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High Risk', className: 'bg-red-100 text-red-800' }
    };
    
    const config = configs[riskLevel];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Access denied. Admin privileges required.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading attendance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Action Controls */}
      <Card>
        <CardContent className="pt-6">
          {/* Single row with filters and actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
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

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportData('attendance')}
                disabled={exportLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportLoading ? 'Exporting...' : 'Export Data'}
              </Button>
              <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                    <DialogDescription>
                      Record attendance for a student in a class session
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student">Student</Label>
                        <div className="relative student-search-container">
                          <Input
                            placeholder="Search students by name, email, or phone..."
                            value={studentSearchValue}
                            onChange={(e) => setStudentSearchValue(e.target.value)}
                            onFocus={() => setStudentSearchOpen(true)}
                            className="w-full"
                          />
                          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          
                          {studentSearchOpen && studentSearchValue && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                              {studentsLoading ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Loading students...</div>
                              ) : (
                                <>
                                  {students && Array.isArray(students) && students
                                    .filter((student) => 
                                      `${student.first_name} ${student.last_name}`.toLowerCase().includes(studentSearchValue.toLowerCase()) ||
                                      student.email.toLowerCase().includes(studentSearchValue.toLowerCase()) ||
                                      (student.phone && student.phone.includes(studentSearchValue))
                                    )
                                    .slice(0, 10) // Limit to 10 results
                                    .map((student) => (
                                      <div
                                        key={student.id}
                                        className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                                        onClick={() => {
                                          setNewAttendance({ ...newAttendance, student_id: student.id });
                                          setStudentSearchValue(`${student.first_name} ${student.last_name}`);
                                          setStudentSearchOpen(false);
                                        }}
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">
                                            {student.first_name} {student.last_name}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {student.email} • {student.role} 
                                            {student.belt_level && ` • ${student.belt_level}`}
                                            {student.phone && ` • ${student.phone}`}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  
                                  {students && Array.isArray(students) && students
                                    .filter((student) => 
                                      `${student.first_name} ${student.last_name}`.toLowerCase().includes(studentSearchValue.toLowerCase()) ||
                                      student.email.toLowerCase().includes(studentSearchValue.toLowerCase()) ||
                                      (student.phone && student.phone.includes(studentSearchValue))
                                    ).length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      No students found matching "{studentSearchValue}"
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="class">Class</Label>
                        <Select value={newAttendance.class_id} onValueChange={(value) => setNewAttendance({ ...newAttendance, class_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newAttendance.date}
                          onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={newAttendance.status} onValueChange={(value: any) => setNewAttendance({ ...newAttendance, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={newAttendance.notes}
                        onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                        placeholder="Additional notes about attendance..."
                      />
                    </div>
                    <Button onClick={handleMarkAttendance} className="w-full">
                      Mark Attendance
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Present</span>
                    </div>
                    <span className="font-medium">{attendanceData?.stats.presentCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Absent</span>
                    </div>
                    <span className="font-medium">{attendanceData?.stats.absentCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Late</span>
                    </div>
                    <span className="font-medium">{attendanceData?.stats.lateCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-blue-500" />
                      <span>Excused</span>
                    </div>
                    <span className="font-medium">{attendanceData?.stats.excusedCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attendanceData?.stats.weeklyTrend.map((week, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{week.week}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{week.attendance_rate}%</span>
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${week.attendance_rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarAttendanceView />
        </TabsContent>
        
        <TabsContent value="enhanced-calendar" className="space-y-4">
          <EnhancedCalendarView />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Attendance Analysis</CardTitle>
              <CardDescription>
                Individual student performance and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Belt Level</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Risk Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData?.stats.studentStats.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.belt_level}</Badge>
                        </TableCell>
                        <TableCell>{student.total_sessions}</TableCell>
                        <TableCell>{student.present_count}</TableCell>
                        <TableCell>{student.attendance_rate}%</TableCell>
                        <TableCell>{getRiskBadge(student.risk_level)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance Analysis</CardTitle>
              <CardDescription>
                Attendance rates and performance by class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData?.stats.classStats.map((cls) => (
                    <TableRow key={cls.class_id}>
                      <TableCell className="font-medium">{cls.class_name}</TableCell>
                      <TableCell>{cls.instructor_name}</TableCell>
                      <TableCell>{cls.total_sessions}</TableCell>
                      <TableCell>{cls.present_count}</TableCell>
                      <TableCell>{cls.absent_count}</TableCell>
                      <TableCell>
                        <Badge variant={cls.attendance_rate >= 80 ? "default" : "secondary"}>
                          {cls.attendance_rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Attendance Records</CardTitle>
              <CardDescription>
                Detailed view of all attendance records with editing capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {record.profiles 
                            ? `${record.profiles.first_name} ${record.profiles.last_name}`
                            : 'Unknown'
                          }
                        </TableCell>
                        <TableCell>{record.classes?.name || 'Unknown Class'}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record as AttendanceRecord);
                              setEditStatus(record.status as 'present' | 'absent' | 'late' | 'excused');
                              setEditNotes(record.notes || '');
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Attendance Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
            <DialogDescription>
              Update the attendance status and add notes for this record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add any relevant notes..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAttendance}>
                Update Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};