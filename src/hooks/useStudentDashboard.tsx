import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NextClass {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  instructor_name?: string;
}

interface DashboardStats {
  totalClasses: number;
  attendanceRate: number;
  nextClass: NextClass | null;
  enrolledClasses: number;
  currentStreak: number;
  monthlyAttendance: number;
}

export const useStudentDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClasses: 0,
    attendanceRate: 0,
    nextClass: null,
    enrolledClasses: 0,
    currentStreak: 0,
    monthlyAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', profile?.id)
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Calculate stats from attendance
      const totalClasses = attendanceData?.length || 0;
      const presentClasses = attendanceData?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

      // Calculate current streak
      let currentStreak = 0;
      for (const record of attendanceData || []) {
        if (record.status === 'present') {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate monthly attendance
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const monthlyAttendance = attendanceData?.filter(a => 
        a.date.startsWith(thisMonth) && a.status === 'present'
      ).length || 0;

      // Fetch enrolled classes
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('class_reservations')
        .select('*')
        .eq('student_id', profile?.id)
        .eq('status', 'reserved');

      if (reservationsError) throw reservationsError;

      const enrolledClasses = reservationsData?.length || 0;

      // Fetch next upcoming class
      const today = new Date();
      const currentDay = today.getDay();
      const currentTime = today.toTimeString().slice(0, 5); // HH:MM format

      const { data: nextClassData, error: nextClassError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          instructor_id,
          class_schedules (
            day_of_week,
            start_time,
            end_time
          ),
          profiles!classes_instructor_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true);

      if (nextClassError) throw nextClassError;

      // Find next class based on schedule
      let nextClass: NextClass | null = null;

      for (const classItem of nextClassData || []) {
        for (const schedule of classItem.class_schedules || []) {
          const dayDiff = schedule.day_of_week - currentDay;
          const isToday = dayDiff === 0;
          const isUpcoming = dayDiff > 0 || dayDiff < -3; // Next week

          if (isToday && schedule.start_time > currentTime) {
            // Class today but later
            const classDate = today.toISOString().split('T')[0];
            nextClass = {
              id: classItem.id,
              name: classItem.name,
              date: classDate,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              instructor_name: classItem.profiles 
                ? `${classItem.profiles.first_name} ${classItem.profiles.last_name}`
                : undefined
            };
            break;
          } else if (isUpcoming) {
            // Next upcoming class this week or next
            const daysToAdd = dayDiff > 0 ? dayDiff : dayDiff + 7;
            const nextDate = new Date(today);
            nextDate.setDate(today.getDate() + daysToAdd);
            const classDate = nextDate.toISOString().split('T')[0];

            if (!nextClass || nextDate < new Date(nextClass.date + 'T' + nextClass.start_time)) {
              nextClass = {
                id: classItem.id,
                name: classItem.name,
                date: classDate,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                instructor_name: classItem.profiles 
                  ? `${classItem.profiles.first_name} ${classItem.profiles.last_name}`
                  : undefined
              };
            }
          }
        }
        if (nextClass) break;
      }

      setStats({
        totalClasses,
        attendanceRate,
        nextClass,
        enrolledClasses,
        currentStreak,
        monthlyAttendance
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    stats,
    loading,
    refreshData
  };
};