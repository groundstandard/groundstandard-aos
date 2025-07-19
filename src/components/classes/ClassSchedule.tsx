import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, Crown, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';

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
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  created_at: string;
}

interface ClassWithSchedule extends Class {
  schedules: ClassSchedule[];
  enrollment_count?: number;
  is_enrolled?: boolean;
}

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const ClassSchedule = () => {
  const [classes, setClasses] = useState<ClassWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassesWithSchedules();
  }, []);

  const fetchClassesWithSchedules = async () => {
    try {
      // Fetch classes with their schedules
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('is_active', true);

      if (classesError) throw classesError;

      // Fetch schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('class_schedules')
        .select('*');

      if (schedulesError) throw schedulesError;

      // Fetch enrollment counts and user enrollments
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select('class_id, student_id')
        .eq('status', 'active');

      if (enrollmentsError) throw enrollmentsError;

      // Combine data
      const classesWithSchedules = classesData.map(classItem => {
        const schedules = schedulesData.filter(s => s.class_id === classItem.id);
        const enrollments = enrollmentsData.filter(e => e.class_id === classItem.id);
        const enrollment_count = enrollments.length;
        const is_enrolled = enrollments.some(e => e.student_id === profile?.id);

        return {
          ...classItem,
          schedules,
          enrollment_count,
          is_enrolled
        };
      });

      setClasses(classesWithSchedules);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch class schedules'
      });
    } finally {
      setLoading(false);
    }
  };

  const enrollInClass = async (classId: string) => {
    // Check subscription limits for free users
    if (!subscriptionInfo?.subscribed) {
      const { data: userEnrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select('id')
        .eq('student_id', profile?.id)
        .eq('status', 'active');

      if (enrollmentError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to check enrollment limits'
        });
        return;
      }

      if (userEnrollments && userEnrollments.length >= 3) {
         toast({
           variant: 'destructive',
           title: 'Upgrade Required',
           description: 'Free plan allows up to 3 classes. Upgrade to premium for unlimited access.',
           action: (
             <Button
               variant="outline"
               size="sm"
               onClick={() => navigate('/subscription')}
             >
               Upgrade
             </Button>
           )
         });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('class_enrollments')
        .insert({
          class_id: classId,
          student_id: profile?.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully enrolled in class!'
      });

      fetchClassesWithSchedules();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to enroll in class'
      });
    }
  };

  const unenrollFromClass = async (classId: string) => {
    try {
      const { error } = await supabase
        .from('class_enrollments')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', profile?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully unenrolled from class'
      });

      fetchClassesWithSchedules();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to unenroll from class'
      });
    }
  };

  const getClassesForDay = (dayOfWeek: number) => {
    return classes.filter(classItem => 
      classItem.schedules.some(schedule => schedule.day_of_week === dayOfWeek)
    );
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const getUserEnrollmentCount = () => {
    return classes.reduce((count, classItem) => {
      return count + (classItem.is_enrolled ? 1 : 0);
    }, 0);
  };

  const isEnrollmentLimited = () => {
    return !subscriptionInfo?.subscribed && getUserEnrollmentCount() >= 3;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="card-minimal">
          <CardContent className="p-6">
            <div className="text-center">Loading class schedules...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status Banner */}
      {!subscriptionInfo?.subscribed && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">
                    Free Plan - Limited to 3 Classes
                  </p>
                  <p className="text-sm text-amber-600">
                    You're using {getUserEnrollmentCount()}/3 free enrollments. 
                    Upgrade for unlimited access.
                  </p>
                </div>
              </div>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => navigate('/subscription')}
                 className="border-amber-300 text-amber-700 hover:bg-amber-100"
               >
                 <Crown className="h-4 w-4 mr-2" />
                 Upgrade
               </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Class Schedule
            {subscriptionInfo?.subscribed && (
              <Badge variant="default" className="ml-2 bg-gradient-primary">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Day selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {DAYS.map((day, index) => (
              <Button
                key={day}
                variant={selectedDay === index ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(index)}
                className="transition-smooth min-w-0 px-3 text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="sm:hidden">{day.slice(0, 3)}</span>
                <span className="hidden sm:inline">{day}</span>
              </Button>
            ))}
          </div>

          {/* Classes for selected day */}
          <div className="space-y-4">
            {getClassesForDay(selectedDay).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No classes scheduled for {DAYS[selectedDay]}</p>
              </div>
            ) : (
              getClassesForDay(selectedDay).map(classItem => {
                const daySchedules = classItem.schedules.filter(s => s.day_of_week === selectedDay);
                
                return daySchedules.map(schedule => (
                  <Card key={`${classItem.id}-${schedule.id}`} className="shadow-soft border hover:shadow-medium transition-smooth">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {classItem.name}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-2">
                            {classItem.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{classItem.skill_level}</Badge>
                            <Badge variant="outline">{classItem.age_group}</Badge>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {profile?.role === 'student' && (
                            classItem.is_enrolled ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => unenrollFromClass(classItem.id)}
                              >
                                Unenroll
                              </Button>
                            ) : (
                              <div className="space-y-2">
                                <Button
                                  size="sm"
                                  onClick={() => enrollInClass(classItem.id)}
                                  disabled={
                                    classItem.enrollment_count >= classItem.max_students ||
                                    isEnrollmentLimited()
                                  }
                                  className={isEnrollmentLimited() ? "opacity-60" : ""}
                                >
                                  {classItem.enrollment_count >= classItem.max_students ? 'Full' : 
                                   isEnrollmentLimited() ? 'Upgrade Required' : 'Enroll'}
                                </Button>
                                {isEnrollmentLimited() && (
                                  <div className="flex items-center gap-1 text-xs text-amber-600">
                                    <Lock className="h-3 w-3" />
                                    <span>Free limit reached</span>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Users className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {classItem.enrollment_count || 0} / {classItem.max_students}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {classItem.duration_minutes} min
                          </span>
                        </div>
                      </div>

                      {classItem.is_enrolled && (
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                            Enrolled
                          </Badge>
                          {subscriptionInfo?.subscribed && (
                            <Badge variant="secondary" className="bg-gradient-primary text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium Access
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ));
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};