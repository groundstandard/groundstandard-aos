import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Search,
  Plus,
  RotateCcw,
  Save,
  AlertTriangle,
  Timer,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAcademy } from '@/hooks/useAcademy';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ABOUTME: Quick Attendance Dashboard - Fast attendance marking for instructors

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  belt_level?: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'excused' | null;
  attendance_id?: string;
  notes?: string;
}

interface ClassSession {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  max_students: number;
  instructor_id: string;
}

export const QuickAttendanceDashboard = () => {
  const { profile } = useAuth();
  const { currentAcademyId } = useAcademy();
  const { toast } = useToast();
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Fetch instructor's classes
  useEffect(() => {
    fetchInstructorClasses();
  }, [profile, currentAcademyId]);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents();
    }
  }, [selectedClass, selectedDate]);

  const fetchInstructorClasses = async () => {
    if (!profile || !currentAcademyId) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          max_students,
          instructor_id,
          class_schedules(start_time, end_time, day_of_week)
        `)
        .eq('instructor_id', profile.id)
        .eq('is_active', true);

      if (error) throw error;

      const today = new Date().getDay();
      const todayClasses = (data || []).filter(cls => 
        cls.class_schedules.some((schedule: any) => schedule.day_of_week === today)
      );

      setClasses(todayClasses.map(cls => ({
        id: cls.id,
        name: cls.name,
        max_students: cls.max_students,
        instructor_id: cls.instructor_id,
        start_time: cls.class_schedules[0]?.start_time || '00:00',
        end_time: cls.class_schedules[0]?.end_time || '00:00'
      })));

      // Auto-select first class if available
      if (todayClasses.length > 0) {
        setSelectedClass(todayClasses[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch your classes'
      });
    }
  };

  const fetchClassStudents = async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      // Get reserved students for this class
      const { data: reservations, error: reservationError } = await supabase
        .from('class_reservations')
        .select(`
          student_id,
          profiles(
            id,
            first_name,
            last_name,
            email,
            belt_level
          )
        `)
        .eq('class_id', selectedClass)
        .eq('status', 'reserved');

      if (reservationError) throw reservationError;

      // Get existing attendance for selected date
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      if (attendanceError) throw attendanceError;

      // Combine student data with attendance status
        const studentsWithAttendance: Student[] = (reservations || []).map(reservation => {
          const student = reservation.profiles;
          const attendanceRecord = attendance?.find(att => att.student_id === student.id);

          return {
            id: student.id,
            first_name: student.first_name,
            last_name: student.last_name,
            email: student.email,
            belt_level: student.belt_level,
            attendance_status: (attendanceRecord?.status as 'present' | 'absent' | 'late' | 'excused') || null,
            attendance_id: attendanceRecord?.id,
            notes: attendanceRecord?.notes
          };
        });

      setStudents(studentsWithAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch class students'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
    try {
      const existingAttendance = students.find(s => s.id === studentId)?.attendance_id;

      if (existingAttendance) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ status, notes })
          .eq('id', existingAttendance);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            class_id: selectedClass,
            date: selectedDate,
            status,
            notes
          });

        if (error) throw error;
      }

      // Update local state
      setStudents(prev => prev.map(student => 
        student.id === studentId 
          ? { ...student, attendance_status: status, notes }
          : student
      ));

      toast({
        title: 'Success',
        description: `Marked ${students.find(s => s.id === studentId)?.first_name} as ${status}`
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark attendance'
      });
    }
  };

  const markBulkAttendance = async () => {
    if (!bulkStatus) return;

    setSaving(true);
    try {
      const updates = filteredStudents.map(student => ({
        student_id: student.id,
        class_id: selectedClass,
        date: selectedDate,
        status: bulkStatus,
        notes: `Bulk marked as ${bulkStatus}`
      }));

      // Delete existing records for these students
      const studentIds = filteredStudents.map(s => s.id);
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', selectedClass)
        .eq('date', selectedDate)
        .in('student_id', studentIds);

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(updates);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Marked ${filteredStudents.length} students as ${bulkStatus}`
      });

      setShowBulkDialog(false);
      setBulkStatus('');
      fetchClassStudents();
    } catch (error) {
      console.error('Error with bulk attendance:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark bulk attendance'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string | null) => {
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

  const getStatusIcon = (status: string | null) => {
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
        return <Timer className="h-4 w-4" />;
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const attendanceStats = {
    total: students.length,
    present: students.filter(s => s.attendance_status === 'present').length,
    absent: students.filter(s => s.attendance_status === 'absent').length,
    late: students.filter(s => s.attendance_status === 'late').length,
    unmarked: students.filter(s => !s.attendance_status).length
  };

  if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin' && profile.role !== 'owner')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Access denied. Instructor privileges required.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Class Selection */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Quick Attendance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.start_time} - {cls.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClass && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <div className="text-2xl font-bold">{attendanceStats.total}</div>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <div className="text-2xl font-bold">{attendanceStats.present}</div>
                <p className="text-sm text-muted-foreground">Present</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <XCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
                <div className="text-2xl font-bold">{attendanceStats.absent}</div>
                <p className="text-sm text-muted-foreground">Absent</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                <div className="text-2xl font-bold">{attendanceStats.late}</div>
                <p className="text-sm text-muted-foreground">Late</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Timer className="h-6 w-6 mx-auto text-gray-500 mb-2" />
                <div className="text-2xl font-bold">{attendanceStats.unmarked}</div>
                <p className="text-sm text-muted-foreground">Unmarked</p>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Bulk Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Mark Attendance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Mark all filtered students ({filteredStudents.length}) with the same attendance status.
                      </p>
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="excused">Excused</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button 
                          onClick={markBulkAttendance} 
                          disabled={!bulkStatus || saving}
                          className="flex-1"
                        >
                          {saving ? 'Marking...' : 'Mark All'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowBulkDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline"
                  onClick={() => {
                    const unmarkedCount = students.filter(s => !s.attendance_status).length;
                    if (unmarkedCount > 0) {
                      const confirmed = confirm(`Mark ${unmarkedCount} unmarked students as absent?`);
                      if (confirmed) {
                        students
                          .filter(s => !s.attendance_status)
                          .forEach(student => markAttendance(student.id, 'absent', 'Auto-marked absent'));
                      }
                    }
                  }}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Mark Unmarked as Absent
                </Button>

                <Button variant="outline" onClick={fetchClassStudents}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Class Roster</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found for this class.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-smooth"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {student.first_name[0]}{student.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-medium">
                            {student.first_name} {student.last_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{student.email}</span>
                            {student.belt_level && (
                              <Badge variant="outline" className="text-xs">
                                {student.belt_level}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {student.attendance_status && (
                          <Badge className={cn("mr-3", getStatusColor(student.attendance_status))}>
                            {getStatusIcon(student.attendance_status)}
                            <span className="ml-1">{student.attendance_status}</span>
                          </Badge>
                        )}

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'present' ? 'default' : 'outline'}
                            onClick={() => markAttendance(student.id, 'present')}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'late' ? 'default' : 'outline'}
                            onClick={() => markAttendance(student.id, 'late')}
                            className="h-8 w-8 p-0"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'absent' ? 'default' : 'outline'}
                            onClick={() => markAttendance(student.id, 'absent')}
                            className="h-8 w-8 p-0"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant={student.attendance_status === 'excused' ? 'default' : 'outline'}
                            onClick={() => markAttendance(student.id, 'excused')}
                            className="h-8 w-8 p-0"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};