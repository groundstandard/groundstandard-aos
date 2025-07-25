import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// ABOUTME: Sidebar showing student's class reservations and attendance history

interface Reservation {
  id: string;
  class_id: string;
  class_name: string;
  instructor_name: string;
  reserved_at: string;
  status: string;
  next_occurrence?: {
    date: Date;
    start_time: string;
    end_time: string;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  class_name: string;
  instructor_name: string;
  notes?: string;
}

export const ClassReservationsSidebar = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch current reservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('class_reservations')
        .select('*')
        .eq('student_id', profile?.id)
        .eq('status', 'reserved')
        .order('reserved_at', { ascending: false });

      if (reservationsError) throw reservationsError;

      // Fetch class details for reservations
      const classIds = reservationsData?.map(r => r.class_id) || [];
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          class_schedules(*),
          profiles!classes_instructor_id_fkey(first_name, last_name)
        `)
        .in('id', classIds);

      if (classesError) throw classesError;

      // Transform reservations data
      const transformedReservations: Reservation[] = (reservationsData || []).map(res => {
        const classData = classesData?.find(c => c.id === res.class_id);
        const nextSchedule = classData?.class_schedules?.[0];
        
        // Calculate next occurrence
        let nextOccurrence;
        if (nextSchedule) {
          const today = new Date();
          const dayOfWeek = nextSchedule.day_of_week;
          const currentDay = today.getDay();
          
          // Debug logging to compare with Dashboard
          console.log('Debug - My Classes Calculation:', {
            className: classData.name,
            scheduleData: nextSchedule,
            dayOfWeek: dayOfWeek,
            currentDay: currentDay,
            today: today.toDateString()
          });
          
          let daysUntilNext = dayOfWeek - currentDay;
          if (daysUntilNext <= 0) daysUntilNext += 7;
          
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + daysUntilNext);
          
          console.log('Debug - My Classes Date Calculation:', {
            daysUntilNext,
            calculatedDate: nextDate.toDateString(),
            formatted: nextDate.toISOString().split('T')[0]
          });
          
          nextOccurrence = {
            date: nextDate,
            start_time: nextSchedule.start_time,
            end_time: nextSchedule.end_time
          };
        }

        return {
          id: res.id,
          class_id: res.class_id,
          class_name: classData?.name || 'Unknown Class',
          instructor_name: classData?.profiles 
            ? `${classData.profiles.first_name} ${classData.profiles.last_name}`
            : 'Unknown Instructor',
          reserved_at: res.reserved_at,
          status: res.status,
          next_occurrence: nextOccurrence
        };
      });

      setReservations(transformedReservations);

      // Fetch attendance history (last 20 records)
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', profile?.id)
        .order('date', { ascending: false })
        .limit(20);

      if (attendanceError) throw attendanceError;

      // Fetch class details for attendance
      const attendanceClassIds = attendanceData?.map(a => a.class_id) || [];
      const { data: attendanceClassesData, error: attendanceClassesError } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_instructor_id_fkey(first_name, last_name)
        `)
        .in('id', attendanceClassIds);

      if (attendanceClassesError) throw attendanceClassesError;

      // Transform attendance data
      const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(att => {
        const classData = attendanceClassesData?.find(c => c.id === att.class_id);
        return {
          id: att.id,
          date: att.date,
          status: att.status as 'present' | 'absent' | 'late' | 'excused',
          class_name: classData?.name || 'Unknown Class',
          instructor_name: classData?.profiles 
            ? `${classData.profiles.first_name} ${classData.profiles.last_name}`
            : 'Unknown Instructor',
          notes: att.notes
        };
      });

      setAttendanceHistory(transformedAttendance);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch class data'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('class_reservations')
        .delete()
        .eq('id', reservationId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Class reservation canceled'
      });

      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel reservation'
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
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

  if (loading) {
    return (
      <Card className="h-fit">
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">My Classes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mb-4">
            <TabsTrigger value="reservations" className="text-xs">
              Reservations ({reservations.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="mt-0 px-4 pb-4">
            <div className="space-y-3">
              {reservations.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No active reservations</p>
                  <p className="text-xs">Reserve classes from the calendar</p>
                </div>
              ) : (
                reservations.map(reservation => (
                  <Card key={reservation.id} className="border shadow-sm">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium text-sm">{reservation.class_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {reservation.instructor_name}
                          </p>
                        </div>
                        
                        {reservation.next_occurrence && (
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(reservation.next_occurrence.date, 'EEE, MMM d')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatTime(reservation.next_occurrence.start_time)} - {formatTime(reservation.next_occurrence.end_time)}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            Reserved
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelReservation(reservation.id)}
                            className="text-xs h-6 px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 px-4 pb-4">
            <div className="space-y-2">
              {attendanceHistory.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No attendance history</p>
                  <p className="text-xs">Your class attendance will appear here</p>
                </div>
              ) : (
                attendanceHistory.map(record => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getStatusColor(record.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(record.status)}
                            {record.status}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-xs font-medium truncate">{record.class_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground italic truncate">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};