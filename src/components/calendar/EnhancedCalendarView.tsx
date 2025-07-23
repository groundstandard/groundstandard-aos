import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CalendarIcon,
  Clock,
  Users,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ClassScheduleItem {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes: {
    id: string;
    name: string;
    description: string;
    max_students: number;
    instructor_id: string;
    profiles: {
      first_name: string;
      last_name: string;
    };
  };
}

export const EnhancedCalendarView = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Fetch class schedules for the calendar view
  const { data: classSchedules = [], isLoading } = useQuery({
    queryKey: ['class-schedules', currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select(`
          id,
          class_id,
          day_of_week,
          start_time,
          end_time,
          classes!inner (
            id,
            name,
            description,
            max_students,
            instructor_id,
            profiles!classes_instructor_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .eq('classes.is_active', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile
  });

  const getClassesForDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    return classSchedules.filter(schedule => schedule.day_of_week === dayOfWeek);
  };

  const canManageSchedules = profile?.role && ['admin', 'owner'].includes(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Calendar View</h2>
          <p className="text-muted-foreground">View class schedules and events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  Next
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              modifiers={{
                hasClasses: (date) => getClassesForDate(date).length > 0
              }}
              modifiersStyles={{
                hasClasses: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, 'MMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="text-center py-8">Loading classes...</div>
              ) : getClassesForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No classes scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getClassesForDate(selectedDate).map((schedule) => (
                    <Card key={schedule.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{schedule.classes.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            Class
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {schedule.start_time} - {schedule.end_time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Instructor: {schedule.classes.profiles.first_name} {schedule.classes.profiles.last_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Max: {schedule.classes.max_students} students
                          </div>
                        </div>

                        {schedule.classes.description && (
                          <p className="text-sm text-muted-foreground">
                            {schedule.classes.description}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};