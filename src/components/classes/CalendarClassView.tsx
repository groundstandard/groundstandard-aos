import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Users, MapPin, Crown, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek } from 'date-fns';
import { ClassReservationsSidebar } from './ClassReservationsSidebar';


// ABOUTME: Calendar-based class selection view for students with real-time class availability

interface Class {
  id: string;
  name: string;
  description: string;
  instructor_id: string;
  max_students: number;
  duration_minutes: number;
  skill_level: string;
  age_group: string;
}

interface ClassSchedule {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ClassInstance {
  class: Class;
  schedule: ClassSchedule;
  date: Date;
  enrollment_count: number;
  is_enrolled: boolean;
  instructor_name?: string;
}

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const CalendarClassView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [classInstances, setClassInstances] = useState<ClassInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    fetchClassesForWeek();
  }, [selectedDate]);

  const fetchClassesForWeek = async () => {
    try {
      setLoading(true);
      
      // Get the start of the week for the selected date
      const weekStart = startOfWeek(selectedDate);
      
      // Fetch classes and schedules
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          class_schedules(*),
          profiles!classes_instructor_id_fkey(first_name, last_name)
        `)
        .eq('is_active', true);

      if (classesError) throw classesError;

      // Fetch reservations for the week
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('class_reservations')
        .select('class_id, student_id')
        .eq('status', 'reserved');

      if (reservationsError) throw reservationsError;

      // Create class instances for the entire week
      const instances: ClassInstance[] = [];
      
      classesData.forEach(classItem => {
        classItem.class_schedules?.forEach(schedule => {
          // Create instances for the next 7 days starting from week start
          for (let i = 0; i < 7; i++) {
            const instanceDate = addDays(weekStart, i);
            if (instanceDate.getDay() === schedule.day_of_week) {
              const reservations = reservationsData.filter(r => r.class_id === classItem.id);
              
              instances.push({
                class: classItem,
                schedule,
                date: instanceDate,
                enrollment_count: reservations.length,
                is_enrolled: reservations.some(r => r.student_id === profile?.id),
                instructor_name: classItem.profiles 
                  ? `${classItem.profiles.first_name} ${classItem.profiles.last_name}`
                  : undefined
              });
            }
          }
        });
      });

      setClassInstances(instances);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch class schedule'
      });
    } finally {
      setLoading(false);
    }
  };

  const enrollInClass = async (classId: string) => {
    // Check subscription limits for free users
    if (!subscriptionInfo?.subscribed) {
      const { data: userReservations, error: reservationError } = await supabase
        .from('class_reservations')
        .select('id')
        .eq('student_id', profile?.id)
        .eq('status', 'reserved');

      if (userReservations && userReservations.length >= 3) {
        toast({
          variant: 'destructive',
          title: 'Upgrade Required',
          description: 'Free plan allows up to 3 classes. Upgrade to premium for unlimited access.'
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('class_reservations')
        .insert({
          class_id: classId,
          student_id: profile?.id,
          status: 'reserved',
          reserved_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully reserved a spot in class!'
      });

      fetchClassesForWeek();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reserve class'
      });
    }
  };

  const cancelReservation = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('class_reservations')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', profile?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully canceled class reservation'
      });

      fetchClassesForWeek();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to cancel reservation'
      });
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const getClassesForDate = (date: Date) => {
    return classInstances.filter(instance => 
      format(instance.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    ).sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time));
  };

  const getUserReservationCount = () => {
    return classInstances.filter(instance => instance.is_enrolled).length;
  };

  if (loading) {
    return (
      <Card className="card-minimal">
        <CardContent className="p-6">
          <div className="text-center">Loading class calendar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Class Calendar
              {subscriptionInfo?.subscribed && (
                <Badge variant="default" className="ml-2 bg-gradient-primary">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  My Classes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>My Classes</DialogTitle>
                </DialogHeader>
                <ClassReservationsSidebar />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {/* Calendar */}
            <div className="w-3/4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border w-full [&_table]:w-full [&_td]:w-full [&_td]:h-14"
                modifiers={{
                  hasClasses: (date) => getClassesForDate(date).length > 0
                }}
                modifiersStyles={{
                  hasClasses: { 
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong>Selected:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
                <p>
                  <strong>Your Reservations:</strong> {getUserReservationCount()}{!subscriptionInfo?.subscribed && '/3'}
                </p>
              </div>
            </div>

            {/* Classes sidebar */}
            <div className="w-1/4 border-l pl-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Classes for {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                
                {getClassesForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No classes scheduled for this date</p>
                  </div>
                ) : (
                  getClassesForDate(selectedDate).map(instance => (
                    <Card key={`${instance.class.id}-${instance.schedule.id}`} className="shadow-soft border hover:shadow-medium transition-smooth">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {instance.class.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {instance.class.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">{instance.class.skill_level}</Badge>
                              <Badge variant="outline">{instance.class.age_group}</Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {instance.is_enrolled ? (
                              <div className="space-y-2">
                                <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                                  Reserved
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs px-2 py-1 h-8"
                                  onClick={() => cancelReservation(instance.class.id)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="text-xs px-2 py-1 h-8"
                                onClick={() => enrollInClass(instance.class.id)}
                                disabled={
                                  instance.enrollment_count >= instance.class.max_students ||
                                  (!subscriptionInfo?.subscribed && getUserReservationCount() >= 3)
                                }
                              >
                                {instance.enrollment_count >= instance.class.max_students ? 'Full' : 
                                 (!subscriptionInfo?.subscribed && getUserReservationCount() >= 3) ? 'Upgrade' : 'Reserve'}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {formatTime(instance.schedule.start_time)} - {formatTime(instance.schedule.end_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {instance.enrollment_count} / {instance.class.max_students}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {instance.class.duration_minutes} min
                            </span>
                          </div>
                        </div>

                        {instance.instructor_name && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <strong>Instructor:</strong> {instance.instructor_name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};