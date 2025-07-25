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
    <div className="min-h-screen bg-background">
      <Card className="card-minimal h-full">
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
        <CardContent className="p-6 h-full">
          <div className="flex gap-8 h-full min-h-[calc(100vh-200px)]">
            {/* Main Calendar Section - 75% width */}
            <div className="w-3/4 flex flex-col min-h-full">
              <div className="bg-card rounded-lg border p-6 flex-1 min-h-[600px]">
                
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="w-full h-full min-h-[500px] [&_table]:w-full [&_table]:h-full [&_table]:table-fixed [&_td]:w-[calc(100%/7)] [&_td]:h-[calc(100%/6)] [&_td]:min-h-[4rem] [&_th]:w-[calc(100%/7)] [&_th]:h-12 [&_th]:text-center [&_button]:h-full [&_button]:w-full [&_button]:min-h-[4rem] [&_.rdp-head_row]:w-full [&_.rdp-head_cell]:w-[calc(100%/7)] text-lg pointer-events-auto"
                  showOutsideDays={false}
                  fixedWeeks={true}
                  components={{
                    Caption: ({ displayMonth }) => (
                      <div className="w-full py-4 mb-4">
                        <h2 className="text-lg font-semibold text-center">
                          {format(displayMonth, 'MMMM yyyy')}
                        </h2>
                      </div>
                    )
                  }}
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
              </div>
              
              {/* Calendar Info */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Selected Date:</span>
                    <p className="text-muted-foreground">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Your Reservations:</span>
                    <p className="text-muted-foreground">
                      {getUserReservationCount()}{!subscriptionInfo?.subscribed && '/3'}
                      {!subscriptionInfo?.subscribed && ' (Free Plan)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Classes Sidebar - 25% width */}
            <div className="w-1/4 flex flex-col">
              <div className="bg-card rounded-lg border p-6 flex-1">
                <h3 className="text-xl font-semibold mb-6 text-foreground">
                  {format(selectedDate, 'EEEE, MMM d')}
                </h3>
                
                <div className="space-y-4 overflow-y-auto max-h-[600px]">
                  {getClassesForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No classes scheduled</p>
                      <p className="text-sm">for this date</p>
                    </div>
                  ) : (
                    getClassesForDate(selectedDate).map(instance => (
                      <Card key={`${instance.class.id}-${instance.schedule.id}`} className="shadow-soft border hover:shadow-medium transition-smooth">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground text-base">
                                  {instance.class.name}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {instance.class.description}
                                </p>
                              </div>
                              
                              <div className="ml-3">
                                {instance.is_enrolled ? (
                                  <div className="text-center space-y-2">
                                    <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                                      Reserved
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-3 py-1 h-7 w-full"
                                      onClick={() => cancelReservation(instance.class.id)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    className="text-xs px-3 py-1 h-7"
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

                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">{instance.class.skill_level}</Badge>
                              <Badge variant="outline" className="text-xs">{instance.class.age_group}</Badge>
                            </div>

                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>
                                  {formatTime(instance.schedule.start_time)} - {formatTime(instance.schedule.end_time)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 flex-shrink-0" />
                                <span>
                                  {instance.enrollment_count} / {instance.class.max_students} students
                                </span>
                              </div>
                              {instance.instructor_name && (
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 flex-shrink-0" />
                                  <span>{instance.instructor_name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};