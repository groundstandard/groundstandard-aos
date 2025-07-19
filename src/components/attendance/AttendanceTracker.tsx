import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  member_id: string;
  member_name: string;
  class_id: string;
  class_name: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  checked_in_at?: string;
  checked_out_at?: string;
}

interface ClassSession {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  instructor: string;
  enrolled_members: number;
  present_count: number;
  attendance_rate: number;
}

export const AttendanceTracker = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Fetch real attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles!attendance_student_id_fkey(first_name, last_name),
          classes!attendance_class_id_fkey(name)
        `)
        .eq('date', dateStr)
        .order('created_at', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Transform data to match interface
      const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => ({
        id: record.id,
        member_id: record.student_id,
        member_name: `${record.profiles?.first_name || ''} ${record.profiles?.last_name || ''}`.trim(),
        class_id: record.class_id,
        class_name: record.classes?.name || 'Unknown Class',
        date: record.date,
        status: record.status as 'present' | 'absent' | 'late' | 'excused',
        notes: record.notes || undefined,
        checked_in_at: record.created_at ? format(new Date(record.created_at), 'HH:mm') : undefined
      }));

      // Fetch class sessions for today
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select(`
          *,
          class_schedules!inner(day_of_week, start_time, end_time),
          profiles!classes_instructor_id_fkey(first_name, last_name)
        `)
        .eq('is_active', true);

      if (classError) throw classError;

      // Transform class data
      const dayOfWeek = selectedDate.getDay();
      const todayClasses = (classData || []).filter(cls => 
        cls.class_schedules.some((schedule: any) => schedule.day_of_week === dayOfWeek)
      );

      const transformedSessions: ClassSession[] = todayClasses.map(cls => {
        const schedule = cls.class_schedules.find((s: any) => s.day_of_week === dayOfWeek);
        const classAttendance = transformedAttendance.filter(att => att.class_id === cls.id);
        const presentCount = classAttendance.filter(att => att.status === 'present').length;
        
        return {
          id: cls.id,
          name: cls.name,
          date: dateStr,
          start_time: schedule?.start_time || '00:00',
          end_time: schedule?.end_time || '00:00',
          instructor: `${cls.profiles?.first_name || ''} ${cls.profiles?.last_name || ''}`.trim() || 'TBD',
          enrolled_members: cls.max_students || 0,
          present_count: presentCount,
          attendance_rate: cls.max_students ? Math.round((presentCount / cls.max_students) * 100) : 0
        };
      });

      setAttendanceRecords(transformedAttendance);
      setClassSessions(transformedSessions);
    } catch (error: any) {
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

  const handleCheckIn = async (classId: string) => {
    if (!profile) return;
    
    setCheckingIn(true);
    try {
      // Find available class to check into today
      const todayClasses = classSessions.filter(session => session.date === format(new Date(), 'yyyy-MM-dd'));
      const targetClass = todayClasses[0]; // Use first available class for simplicity
      
      if (!targetClass) {
        toast({
          variant: 'destructive',
          title: 'No Classes',
          description: 'No classes scheduled for today'
        });
        return;
      }

      // Create real attendance record
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: profile.id,
          class_id: targetClass.id,
          date: format(new Date(), 'yyyy-MM-dd'),
          status: 'present',
          notes: 'Self check-in'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Checked in successfully!'
      });

      // Refresh data
      fetchAttendanceData();
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to check in: ' + (error.message || 'Unknown error')
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleExportAttendance = () => {
    const dataToExport = isAdmin ? filteredRecords : myAttendanceRecords;
    const csv = [
      ['Date', 'Member', 'Class', 'Status', 'Check In', 'Notes'],
      ...dataToExport.map(record => [
        record.date,
        record.member_name,
        record.class_name,
        record.status,
        record.checked_in_at || '',
        record.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      case 'excused':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.class_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDate = record.date === format(selectedDate, 'yyyy-MM-dd');
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const myAttendanceRecords = attendanceRecords.filter(record => 
    record.member_id === profile?.id
  ).slice(0, 10);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="card-minimal">
          <CardContent className="p-6">
            <div className="text-center">Loading attendance data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="card-minimal shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {isAdmin ? 'Attendance Management' : 'Check In / Attendance'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="shadow-soft hover:shadow-medium transition-smooth cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                    <h3 className="font-semibold">Quick Check-In</h3>
                    <p className="text-sm text-muted-foreground">
                      Check in to today's class
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => handleCheckIn('current-class')}
                      disabled={checkingIn}
                    >
                      {checkingIn ? 'Checking In...' : 'Check In Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <Clock className="h-8 w-8 mx-auto text-blue-600" />
                    <h3 className="font-semibold">Today's Classes</h3>
                    <p className="text-sm text-muted-foreground">
                      {classSessions.length} classes scheduled
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/classes')}
                    >
                      View Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members or classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="excused">Excused</option>
              </select>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportAttendance}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Sessions (Admin View) */}
      {isAdmin && (
        <Card className="card-minimal shadow-soft">
          <CardHeader>
            <CardTitle>Today's Class Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classSessions.map((session) => (
                <Card key={session.id} className="shadow-soft hover:shadow-medium transition-smooth">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold">{session.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {session.start_time} - {session.end_time}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {session.instructor}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {session.present_count}/{session.enrolled_members}
                          </span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={session.attendance_rate >= 80 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                        >
                          {session.attendance_rate}%
                        </Badge>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          toast({
                            title: "Feature Coming Soon",
                            description: "Individual attendance management will be available soon"
                          });
                        }}
                      >
                        Manage Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      <Card className="card-minimal shadow-elegant">
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'Attendance Records' : 'My Attendance History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(isAdmin ? filteredRecords : myAttendanceRecords).map((record) => (
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
                      {isAdmin ? record.member_name : format(new Date(record.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {record.checked_in_at && `In: ${record.checked_in_at}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.checked_out_at && `Out: ${record.checked_out_at}`}
                  </p>
                  {record.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {record.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {(isAdmin ? filteredRecords : myAttendanceRecords).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No attendance records found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};