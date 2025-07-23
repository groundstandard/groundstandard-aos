import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Calendar, Target, TrendingUp, Award, Crown, Lock, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'excused';
  class_name: string;
}

interface ProgressStats {
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number;
  currentStreak: number;
  monthlyAttendance: number;
  enrolledClasses: number;
}

const beltLevels = [
  { name: 'White', color: 'bg-gray-100 text-gray-800', order: 1 },
  { name: 'Yellow', color: 'bg-yellow-100 text-yellow-800', order: 2 },
  { name: 'Orange', color: 'bg-orange-100 text-orange-800', order: 3 },
  { name: 'Green', color: 'bg-green-100 text-green-800', order: 4 },
  { name: 'Blue', color: 'bg-blue-100 text-blue-800', order: 5 },
  { name: 'Purple', color: 'bg-purple-100 text-purple-800', order: 6 },
  { name: 'Brown', color: 'bg-amber-100 text-amber-800', order: 7 },
  { name: 'Black', color: 'bg-gray-900 text-white', order: 8 },
];

export const ProgressTracker = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalClasses: 0,
    attendedClasses: 0,
    attendanceRate: 0,
    currentStreak: 0,
    monthlyAttendance: 0,
    enrolledClasses: 0
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { subscriptionInfo } = useSubscription();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      fetchProgressData();
    }
  }, [profile]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          notes,
          classes (
            name
          )
        `)
        .eq('student_id', profile?.id)
        .order('date', { ascending: false })
        .limit(50);

      if (attendanceError) throw attendanceError;

      // Transform attendance data
      const records = attendanceData?.map(record => ({
        id: record.id,
        date: record.date,
        status: record.status as 'present' | 'absent' | 'excused',
        class_name: record.classes?.name || 'Unknown Class'
      })) || [];

      setAttendanceRecords(records);

      // Calculate statistics
      const totalClasses = records.length;
      const attendedClasses = records.filter(r => r.status === 'present').length;
      const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

      // Calculate current streak
      let currentStreak = 0;
      for (const record of records) {
        if (record.status === 'present') {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate monthly attendance
      const monthStart = startOfMonth(new Date());
      const monthlyRecords = records.filter(r => new Date(r.date) >= monthStart);
      const monthlyAttendance = monthlyRecords.filter(r => r.status === 'present').length;

      // Get reserved classes count
      const { count: reservedCount } = await supabase
        .from('class_reservations')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile?.id)
        .eq('status', 'reserved');

      setProgressStats({
        totalClasses,
        attendedClasses,
        attendanceRate,
        currentStreak,
        monthlyAttendance,
        enrolledClasses: reservedCount || 0
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch progress data'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBelt = () => {
    return beltLevels.find(belt => 
      belt.name.toLowerCase() === (profile?.belt_level?.toLowerCase() || 'white')
    ) || beltLevels[0];
  };

  const getNextBelt = () => {
    const currentBelt = getCurrentBelt();
    return beltLevels.find(belt => belt.order === currentBelt.order + 1);
  };

  const calculateBeltProgress = () => {
    // Simple progression based on attendance rate and total classes
    const baseProgress = Math.min(progressStats.attendanceRate, 100);
    const classBonus = Math.min(progressStats.totalClasses * 2, 30);
    return Math.min(baseProgress + classBonus, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="card-minimal">
          <CardContent className="p-6">
            <div className="text-center">Loading progress data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentBelt = getCurrentBelt();
  const nextBelt = getNextBelt();
  const beltProgress = calculateBeltProgress();

  return (
    <div className="space-y-6">

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-minimal hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{progressStats.totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{progressStats.attendanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{progressStats.currentStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-minimal hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{progressStats.monthlyAttendance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Belt Progress */}
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Belt Progression
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={currentBelt.color}>
                Current: {currentBelt.name} Belt
              </Badge>
              {nextBelt && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <Badge className={nextBelt.color} variant="outline">
                    Next: {nextBelt.name} Belt
                  </Badge>
                </>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {beltProgress.toFixed(0)}% Progress
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress value={beltProgress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Keep attending classes regularly to progress to your next belt level!
            </p>
          </div>

          {/* Advanced Features - Now Available to All Members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-subtle rounded-lg">
            <div className="text-center">
              <Star className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Technique Analysis</p>
              <p className="text-xs text-muted-foreground">AI-powered feedback</p>
            </div>
            <div className="text-center">
              <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Achievement Tracking</p>
              <p className="text-xs text-muted-foreground">Milestone rewards</p>
            </div>
            <div className="text-center">
              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Custom Goals</p>
              <p className="text-xs text-muted-foreground">Personalized targets</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card className="card-minimal">
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceRecords.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{record.class_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(record.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <Badge
                    variant={
                      record.status === 'present' 
                        ? 'default' 
                        : record.status === 'excused' 
                        ? 'secondary' 
                        : 'destructive'
                    }
                  >
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};