import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Award, TrendingUp, Users, Clock, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface BeltProgression {
  id: string;
  belt_level: string;
  next_belt_level: string | null;
  minimum_classes_required: number;
  minimum_time_months: number;
  requirements: any[];
  belt_order: number;
  is_active: boolean;
}

interface StudentBeltInfo {
  id: string;
  first_name: string;
  last_name: string;
  belt_level: string | null;
  current_belt_date: string | null;
  classes_attended: number;
  months_at_current_belt: number;
  ready_for_test: boolean;
  next_belt: string | null;
}

export const BeltProgressionDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [promotionNotes, setPromotionNotes] = useState('');
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);

  // Fetch belt progressions
  const { data: beltProgressions, isLoading: loadingProgressions } = useQuery({
    queryKey: ['belt-progressions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('belt_progressions')
        .select('*')
        .eq('is_active', true)
        .order('belt_order');
      
      if (error) throw error;
      return data as BeltProgression[];
    }
  });

  // Fetch students with belt progression info
  const { data: studentsInfo, isLoading: loadingStudents } = useQuery({
    queryKey: ['students-belt-info'],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          belt_level,
          created_at
        `)
        .eq('role', 'student')
        .eq('membership_status', 'active');

      if (error) throw error;

      // Get attendance data for each student
      const studentsWithProgress = await Promise.all(
        students.map(async (student) => {
          // Get total classes attended
          const { count: classesAttended } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('status', 'present');

          // Get current belt history
          const { data: beltHistory } = await supabase
            .from('student_belt_history')
            .select('*')
            .eq('student_id', student.id)
            .order('promoted_date', { ascending: false })
            .limit(1);

          const currentBeltDate = beltHistory?.[0]?.promoted_date || student.created_at;
          const monthsAtCurrentBelt = Math.floor(
            (new Date().getTime() - new Date(currentBeltDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
          );

          // Find next belt
          const currentBelt = beltProgressions?.find(bp => bp.belt_level === student.belt_level);
          const nextBelt = currentBelt?.next_belt_level;

          // Check if ready for test
          const readyForTest = currentBelt ? 
            (classesAttended || 0) >= currentBelt.minimum_classes_required &&
            monthsAtCurrentBelt >= currentBelt.minimum_time_months :
            false;

          return {
            ...student,
            current_belt_date: currentBeltDate,
            classes_attended: classesAttended || 0,
            months_at_current_belt: monthsAtCurrentBelt,
            ready_for_test: readyForTest,
            next_belt: nextBelt
          };
        })
      );

      return studentsWithProgress as StudentBeltInfo[];
    },
    enabled: !!beltProgressions
  });

  // Promote student mutation
  const promoteMutation = useMutation({
    mutationFn: async ({ studentId, newBeltLevel }: { studentId: string; newBeltLevel: string }) => {
      // Update student's belt level
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ belt_level: newBeltLevel, updated_at: new Date().toISOString() })
        .eq('id', studentId);

      if (profileError) throw profileError;

      // Record in belt history
      const { error: historyError } = await supabase
        .from('student_belt_history')
        .insert({
          student_id: studentId,
          belt_level: newBeltLevel,
          promoted_by: profile?.id,
          promoted_date: new Date().toISOString().split('T')[0], // date format
          notes: promotionNotes
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student promoted successfully!'
      });
      queryClient.invalidateQueries({ queryKey: ['students-belt-info'] });
      setShowPromotionDialog(false);
      setPromotionNotes('');
      setSelectedStudent('');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to promote student'
      });
    }
  });

  const handlePromotion = () => {
    const student = studentsInfo?.find(s => s.id === selectedStudent);
    if (student && student.next_belt) {
      promoteMutation.mutate({
        studentId: selectedStudent,
        newBeltLevel: student.next_belt
      });
    }
  };

  const getBeltColor = (beltLevel: string | null) => {
    const colors: Record<string, string> = {
      'White': 'bg-gray-100 text-gray-800',
      'Yellow': 'bg-yellow-100 text-yellow-800',
      'Orange': 'bg-orange-100 text-orange-800',
      'Green': 'bg-green-100 text-green-800',
      'Blue': 'bg-blue-100 text-blue-800',
      'Purple': 'bg-purple-100 text-purple-800',
      'Brown': 'bg-amber-100 text-amber-800',
      'Black': 'bg-gray-900 text-white'
    };
    return colors[beltLevel || 'White'] || 'bg-gray-100 text-gray-800';
  };

  if (loadingProgressions || loadingStudents) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const readyForPromotion = studentsInfo?.filter(s => s.ready_for_test) || [];
  const totalStudents = studentsInfo?.length || 0;
  const averageClasses = totalStudents > 0 ? 
    Math.round((studentsInfo?.reduce((sum, s) => sum + s.classes_attended, 0) || 0) / totalStudents) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ready for Promotion</p>
                <p className="text-2xl font-bold text-green-600">{readyForPromotion.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Average Classes</p>
                <p className="text-2xl font-bold">{averageClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Belt Levels</p>
                <p className="text-2xl font-bold">{beltProgressions?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotion Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Student Belt Progression</span>
            <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Promote Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Promote Student</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select Student</label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student ready for promotion" />
                      </SelectTrigger>
                      <SelectContent>
                        {readyForPromotion.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.first_name} {student.last_name} - {student.belt_level} → {student.next_belt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Promotion Notes</label>
                    <Textarea
                      placeholder="Add notes about this promotion..."
                      value={promotionNotes}
                      onChange={(e) => setPromotionNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handlePromotion} 
                      disabled={!selectedStudent || promoteMutation.isPending}
                      className="flex-1"
                    >
                      {promoteMutation.isPending ? 'Promoting...' : 'Confirm Promotion'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPromotionDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Current Belt</TableHead>
                <TableHead>Classes Attended</TableHead>
                <TableHead>Time at Belt</TableHead>
                <TableHead>Next Belt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsInfo?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getBeltColor(student.belt_level)}>
                      {student.belt_level || 'White'}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.classes_attended}</TableCell>
                  <TableCell>{student.months_at_current_belt} months</TableCell>
                  <TableCell>
                    {student.next_belt ? (
                      <Badge variant="outline" className={getBeltColor(student.next_belt)}>
                        {student.next_belt}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Max Level</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.ready_for_test ? 'default' : 'secondary'}>
                      {student.ready_for_test ? 'Ready' : 'In Progress'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};