import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClassWithSchedule {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  skill_level: string;
  age_group: string;
  max_students: number;
  class_schedules: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[];
  enrollments_count?: number;
  is_enrolled?: boolean;
}

const Classes = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<ClassWithSchedule[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      
      // Fetch classes with schedules
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          class_schedules (
            day_of_week,
            start_time,
            end_time
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (classesError) throw classesError;

      // For each class, check enrollment count and if current user is enrolled
      const classesWithEnrollments = await Promise.all(
        (classesData || []).map(async (classItem) => {
          // Get enrollment count
          const { count: enrollmentCount } = await supabase
            .from('class_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id)
            .eq('status', 'active');

          // Check if current user is enrolled
          const { data: userEnrollment } = await supabase
            .from('class_enrollments')
            .select('*')
            .eq('class_id', classItem.id)
            .eq('student_id', user?.id)
            .eq('status', 'active')
            .single();

          return {
            ...classItem,
            enrollments_count: enrollmentCount || 0,
            is_enrolled: !!userEnrollment
          };
        })
      );

      setClasses(classesWithEnrollments);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load classes"
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleEnrollment = async (classId: string, isEnrolled: boolean) => {
    try {
      if (isEnrolled) {
        // Unenroll
        const { error } = await supabase
          .from('class_enrollments')
          .delete()
          .eq('class_id', classId)
          .eq('student_id', user?.id);

        if (error) throw error;

        toast({
          title: "Unenrolled",
          description: "You have been unenrolled from the class"
        });
      } else {
        // Enroll
        const { error } = await supabase
          .from('class_enrollments')
          .insert({
            class_id: classId,
            student_id: user?.id
          });

        if (error) throw error;

        toast({
          title: "Enrolled",
          description: "You have been enrolled in the class"
        });
      }

      // Refresh classes
      fetchClasses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update enrollment"
      });
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgeGroupColor = (group: string) => {
    switch (group) {
      case 'kids': return 'bg-blue-100 text-blue-800';
      case 'teens': return 'bg-purple-100 text-purple-800';
      case 'adults': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || loadingClasses) {
    return <div className="min-h-screen flex items-center justify-center">Loading classes...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to view classes.</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Classes</h1>
          <p className="text-muted-foreground">Explore and enroll in martial arts classes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{classItem.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getSkillLevelColor(classItem.skill_level)}>
                      {classItem.skill_level}
                    </Badge>
                    <Badge className={getAgeGroupColor(classItem.age_group)}>
                      {classItem.age_group}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{classItem.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{classItem.duration_minutes} minutes</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{classItem.enrollments_count}/{classItem.max_students} students</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Schedule:</span>
                  </div>
                  {classItem.class_schedules.map((schedule, index) => (
                    <div key={index} className="ml-6 text-sm">
                      <span className="font-medium">{dayNames[schedule.day_of_week]}</span>
                      <span className="ml-2 text-muted-foreground">
                        {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>

                {profile?.role === 'student' && (
                  <Button
                    onClick={() => handleEnrollment(classItem.id, classItem.is_enrolled || false)}
                    variant={classItem.is_enrolled ? "destructive" : "default"}
                    className="w-full"
                    disabled={!classItem.is_enrolled && classItem.enrollments_count >= classItem.max_students}
                  >
                    {classItem.is_enrolled 
                      ? "Unenroll" 
                      : classItem.enrollments_count >= classItem.max_students 
                        ? "Class Full" 
                        : "Enroll"
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No classes available</h3>
            <p className="text-muted-foreground">Check back later for new classes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;