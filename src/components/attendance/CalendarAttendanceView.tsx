import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarIcon,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClassSession {
  id: string;
  name: string;
  instructor_name: string;
  start_time: string;
  end_time: string;
  max_students: number;
  reserved_students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    belt_level: string;
    status: 'reserved' | 'checked_in' | 'absent';
    check_in_location?: {
      latitude: number;
      longitude: number;
      distance_from_academy?: number;
    };
  }>;
}

export const CalendarAttendanceView = () => {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch classes for selected date
  const { data: classesData = [], isLoading } = useQuery({
    queryKey: ['daily-classes', selectedDate?.toISOString().split('T')[0]],
    queryFn: async () => {
      if (!selectedDate) return [];

      const dateStr = selectedDate.toISOString().split('T')[0];
      const dayOfWeek = selectedDate.getDay();
      
      console.log('Selected date:', dateStr, 'Day of week (JS getDay()):', dayOfWeek);

      // Get classes scheduled for this day of the week
      const { data: classSchedules, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          start_time,
          end_time,
          classes!inner (
            id,
            name,
            max_students,
            instructor_id,
            start_date,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .eq('day_of_week', dayOfWeek)
        .eq('classes.is_active', true);

      if (error) throw error;

        // For each class, get reserved students and their attendance for the selected date
        const classesWithStudents = await Promise.all(
          classSchedules.map(async (schedule) => {
            // Get reserved students
            const { data: reservations } = await supabase
              .from('class_reservations')
            .select(`
              student_id,
              profiles (
                id,
                first_name,
                last_name,
                belt_level
              )
            `)
            .eq('class_id', schedule.classes.id)
            .eq('status', 'reserved');

          // Get attendance records for this date
          const { data: attendanceRecords } = await supabase
            .from('attendance')
            .select('student_id, status, notes')
            .eq('class_id', schedule.classes.id)
            .eq('date', dateStr);

          // Create attendance map
          const attendanceMap = new Map(
            attendanceRecords?.map(record => [record.student_id, record]) || []
          );

          // Combine reservation and attendance data
          const reservedStudents = reservations?.map(reservation => {
            const attendance = attendanceMap.get(reservation.student_id);
            return {
              id: reservation.student_id,
              first_name: reservation.profiles.first_name,
              last_name: reservation.profiles.last_name,
              belt_level: reservation.profiles.belt_level || 'White',
              status: attendance ? 
                (attendance.status === 'present' ? 'checked_in' : 'absent') : 
                'reserved' as 'reserved' | 'checked_in' | 'absent',
              // Note: Location data would come from a separate check-in system
              // For now, we'll simulate proximity based on check-in status
              check_in_location: attendance?.status === 'present' ? {
                latitude: 0,
                longitude: 0,
                distance_from_academy: Math.random() * 2 // Simulate 0-2 miles
              } : undefined
            };
          }) || [];

          return {
            id: schedule.classes.id,
            name: schedule.classes.name,
            instructor_name: schedule.classes.profiles ? 
              `${schedule.classes.profiles.first_name} ${schedule.classes.profiles.last_name}` : 
              'No instructor assigned',
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            max_students: schedule.classes.max_students,
            reserved_students: reservedStudents
          };
        })
      );

      return classesWithStudents;
    },
    enabled: !!selectedDate
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string, isNearAcademy?: boolean) => {
    const baseClasses = "text-xs font-medium";
    
    switch (status) {
      case 'checked_in':
        return (
          <Badge variant={isNearAcademy ? "default" : "secondary"} className={baseClasses}>
            {isNearAcademy ? "Present (On-site)" : "Present (Remote)"}
          </Badge>
        );
      case 'absent':
        return <Badge variant="destructive" className={baseClasses}>Absent</Badge>;
      default:
        return <Badge variant="outline" className={baseClasses}>Reserved</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Section */}
        <Card className="lg:w-1/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
            <CardDescription>
              Choose a date to view class schedules and attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className={cn("w-full pointer-events-auto")}
            />
            {selectedDate && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Selected Date:</p>
                <p className="text-lg font-semibold text-primary">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classes for Selected Date */}
        <Card className="lg:w-2/3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Classes for {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Selected Date'}
            </CardTitle>
            <CardDescription>
              View all scheduled classes and student attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading classes...</div>
            ) : classesData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No classes scheduled for this date
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {classesData.map((classSession) => (
                    <Card key={classSession.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{classSession.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {classSession.start_time} - {classSession.end_time}
                          </div>
                        </div>
                        <CardDescription>
                          Instructor: {classSession.instructor_name} • 
                          Capacity: {classSession.reserved_students.length}/{classSession.max_students}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Present: {classSession.reserved_students.filter(s => s.status === 'checked_in').length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>Absent: {classSession.reserved_students.filter(s => s.status === 'absent').length}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <span>Not Marked: {classSession.reserved_students.filter(s => s.status === 'reserved').length}</span>
                            </div>
                          </div>

                          {/* Student List */}
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Reserved Students:</h4>
                            <div className="grid gap-2">
                              {classSession.reserved_students.map((student) => {
                                const isNearAcademy = student.check_in_location && 
                                  student.check_in_location.distance_from_academy !== undefined &&
                                  student.check_in_location.distance_from_academy <= 1;

                                return (
                                  <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 bg-card border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      {getStatusIcon(student.status)}
                                      <div>
                                        <p className="font-medium">
                                          {student.first_name} {student.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {student.belt_level} Belt
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {student.check_in_location && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <MapPin className="h-3 w-3" />
                                          {student.check_in_location.distance_from_academy?.toFixed(1)}mi
                                        </div>
                                      )}
                                      {getStatusBadge(student.status, isNearAcademy)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};