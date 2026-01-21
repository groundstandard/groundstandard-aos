import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, Clock, Award, Eye, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BeltTesting = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTest, setEditTest] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewTest, setViewTest] = useState<any | null>(null);
  const [isEvaluateDialogOpen, setIsEvaluateDialogOpen] = useState(false);
  const [evaluateTest, setEvaluateTest] = useState<any | null>(null);
  const [evaluation, setEvaluation] = useState({
    result: "" as "passed" | "failed" | "",
    notes: "",
    evaluated_by: "",
  });

  // Only allow admin and owner access
  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need administrator privileges to manage belt testing.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: students } = useQuery({
    queryKey: ['students-for-testing'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .eq('membership_status', 'active');
      return data || [];
    }
  });

  const { data: evaluators = [] } = useQuery({
    queryKey: ['belt-test-evaluators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('role', ['instructor', 'admin', 'owner'])
        .order('first_name');

      if (error) throw error;
      return data || [];
    }
  });

  const { data: beltTests } = useQuery({
    queryKey: ['belt-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('belt_tests')
        .select('*')
        .order('test_date', { ascending: true });

      if (error) throw error;

      // Fetch profile data for each belt test
      const testsWithProfiles = await Promise.all(
        (data || []).map(async (test) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, belt_level')
            .eq('id', test.student_id)
            .single();

          return {
            id: test.id,
            student_id: test.student_id,
            student: profile || { first_name: 'Unknown', last_name: 'Student', belt_level: 'White' },
            current_belt: test.current_belt,
            target_belt: test.target_belt,
            test_date: test.test_date,
            status: test.status,
            notes: test.notes || '',
            result: test.result || null,
            evaluated_by: test.evaluated_by || null,
          };
        })
      );

      return testsWithProfiles;
    }
  });

  const filteredTests = (beltTests || []).filter((test: any) => {
    const fullName = `${test.student.first_name} ${test.student.last_name}`.toLowerCase();
    const beltStr = `${test.current_belt} ${test.target_belt}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      beltStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateTestingMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      current_belt: string;
      target_belt: string;
      test_date: string;
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('belt_tests')
        .update({
          current_belt: payload.current_belt,
          target_belt: payload.target_belt,
          test_date: payload.test_date,
          notes: payload.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Belt test updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['belt-tests'] });
      setIsEditDialogOpen(false);
      setEditTest(null);
    },
    onError: (error: any) => {
      console.error('Belt test update error:', error);
      toast({ title: "Error updating belt test", variant: "destructive" });
    }
  });

  const createTestingMutation = useMutation({
    mutationFn: async (testData: {
      student_id: string;
      current_belt: string;
      target_belt: string;
      test_date: string;
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('belt_tests')
        .insert([{
          student_id: testData.student_id,
          current_belt: testData.current_belt,
          target_belt: testData.target_belt,
          test_date: testData.test_date,
          status: 'scheduled',
          notes: testData.notes
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Belt test scheduled successfully!" });
      queryClient.invalidateQueries({ queryKey: ['belt-tests'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      console.error('Belt test creation error:', error);
      toast({ title: "Error scheduling belt test", variant: "destructive" });
    }
  });

  const evaluateTestingMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      student_id: string;
      target_belt: string;
      result: 'passed' | 'failed';
      notes: string;
      evaluated_by: string;
    }) => {
      const { error } = await supabase
        .from('belt_tests')
        .update({
          status: 'completed',
          result: payload.result,
          notes: payload.notes || null,
          evaluated_by: payload.evaluated_by || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id);

      if (error) throw error;

      if (payload.result === 'passed') {
        const { error: beltError } = await supabase
          .from('profiles')
          .update({ belt_level: payload.target_belt })
          .eq('id', payload.student_id);

        if (beltError) throw beltError;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Belt test evaluated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['belt-tests'] });
      setIsEvaluateDialogOpen(false);
      setEvaluateTest(null);
      setEvaluation({ result: "", notes: "", evaluated_by: "" });
    },
    onError: (error: any) => {
      console.error('Belt test evaluation error:', error);
      toast({ title: "Error evaluating belt test", variant: "destructive" });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      belt_level: string;
    }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          belt_level: payload.belt_level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Student profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['students-for-testing'] });
    },
    onError: (error: any) => {
      console.error('Student profile update error:', error);
      toast({ title: "Error updating student profile", variant: "destructive" });
    }
  });

  const getNextBelt = (currentBelt: string) => {
    const beltProgression = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'];
    const currentIndex = beltProgression.indexOf(currentBelt);
    return currentIndex >= 0 && currentIndex < beltProgression.length - 1
      ? beltProgression[currentIndex + 1]
      : 'Black';
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Belt Testing</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage student belt promotions and testing schedules
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Tests</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{beltTests?.filter(test => test.status === 'scheduled').length || 0}</div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{beltTests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {beltTests && beltTests.length > 0
                  ? Math.round((beltTests.filter(test => test.status === 'completed').length / beltTests.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Testing Schedule</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Schedule Belt Test</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Belt Test</DialogTitle>
                <DialogDescription>
                  Schedule a belt promotion test for a student
                </DialogDescription>
              </DialogHeader>
              <CreateBeltTestForm
                students={students || []}
                onSubmit={(data) => createTestingMutation.mutate(data)}
                isLoading={createTestingMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search students or belt levels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditTest(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Belt Test</DialogTitle>
              <DialogDescription>
                Update the schedule details for this belt test
              </DialogDescription>
            </DialogHeader>
            {editTest && (
              <EditBeltTestForm
                initialData={editTest}
                onSubmit={(data) => updateTestingMutation.mutate(data)}
                isLoading={updateTestingMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isViewDialogOpen}
          onOpenChange={(open) => {
            setIsViewDialogOpen(open);
            if (!open) setViewTest(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>View Belt Test</DialogTitle>
              <DialogDescription>
                View the details of this belt test
              </DialogDescription>
            </DialogHeader>
            {viewTest && (
              <ViewBeltTestForm
                initialData={viewTest}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEvaluateDialogOpen}
          onOpenChange={(open) => {
            setIsEvaluateDialogOpen(open);
            if (!open) {
              setEvaluateTest(null);
              setEvaluation({ result: "", notes: "", evaluated_by: "" });
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Evaluate Belt Test</DialogTitle>
              <DialogDescription>
                Evaluate the result of this belt test
              </DialogDescription>
            </DialogHeader>
            {evaluateTest && (
              <EvaluateBeltTestForm
                initialData={evaluateTest}
                evaluators={evaluators}
                onSubmit={(data) => evaluateTestingMutation.mutate(data)}
                isLoading={evaluateTestingMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Belt Tests</CardTitle>
            <CardDescription>Students scheduled for belt promotion tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTests.map((test: any, index: number) => (
                <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{test.student.first_name} {test.student.last_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {test.current_belt} → {test.target_belt} Belt
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={test.status === 'confirmed' ? 'default' : 'secondary'}>
                      {test.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{test.test_date}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewTest(test);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditTest({
                          id: test.id,
                          current_belt: test.current_belt,
                          target_belt: test.target_belt,
                          test_date: test.test_date,
                          notes: test.notes || '',
                        });
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {test.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setEvaluateTest(test);
                          setEvaluation({ result: "", notes: test.notes || "", evaluated_by: "" });
                          setIsEvaluateDialogOpen(true);
                        }}
                      >
                        Evaluate
                      </Button>
                    )}
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No belt tests scheduled</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface CreateBeltTestFormProps {
  students: any[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const CreateBeltTestForm = ({ students, onSubmit, isLoading }: CreateBeltTestFormProps) => {
  const [formData, setFormData] = useState({
    student_id: '',
    current_belt: '',
    target_belt: '',
    test_date: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const beltLevels = [
    'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student">Student</Label>
        <Select value={formData.student_id} onValueChange={(value) => setFormData({...formData, student_id: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="current_belt">Current Belt</Label>
          <Select value={formData.current_belt} onValueChange={(value) => setFormData({...formData, current_belt: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Current belt" />
            </SelectTrigger>
            <SelectContent>
              {beltLevels.map((belt) => (
                <SelectItem key={belt} value={belt}>{belt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="target_belt">Target Belt</Label>
          <Select value={formData.target_belt} onValueChange={(value) => setFormData({...formData, target_belt: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Target belt" />
            </SelectTrigger>
            <SelectContent>
              {beltLevels.map((belt) => (
                <SelectItem key={belt} value={belt}>{belt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="test_date">Test Date</Label>
        <Input
          type="date"
          value={formData.test_date}
          onChange={(e) => setFormData({...formData, test_date: e.target.value})}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          placeholder="Test requirements or notes..."
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Scheduling..." : "Schedule Test"}
      </Button>
    </form>
  );
};

interface EditBeltTestFormProps {
  initialData: {
    id: string;
    current_belt: string;
    target_belt: string;
    test_date: string;
    notes: string;
  };
  onSubmit: (data: { id: string; current_belt: string; target_belt: string; test_date: string; notes: string }) => void;
  isLoading: boolean;
}

const EditBeltTestForm = ({ initialData, onSubmit, isLoading }: EditBeltTestFormProps) => {
  const [formData, setFormData] = useState({
    id: initialData.id,
    current_belt: initialData.current_belt,
    target_belt: initialData.target_belt,
    test_date: initialData.test_date,
    notes: initialData.notes,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const beltLevels = [
    'White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Black'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit_current_belt">Current Belt</Label>
          <Select value={formData.current_belt} onValueChange={(value) => setFormData({ ...formData, current_belt: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Current belt" />
            </SelectTrigger>
            <SelectContent>
              {beltLevels.map((belt) => (
                <SelectItem key={belt} value={belt}>{belt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="edit_target_belt">Target Belt</Label>
          <Select value={formData.target_belt} onValueChange={(value) => setFormData({ ...formData, target_belt: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Target belt" />
            </SelectTrigger>
            <SelectContent>
              {beltLevels.map((belt) => (
                <SelectItem key={belt} value={belt}>{belt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="edit_test_date">Test Date</Label>
        <Input
          id="edit_test_date"
          type="date"
          value={formData.test_date}
          onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="edit_notes">Notes</Label>
        <Textarea
          id="edit_notes"
          placeholder="Test requirements or notes..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
};

interface ViewBeltTestFormProps {
  initialData: any;
}

const ViewBeltTestForm = ({ initialData }: ViewBeltTestFormProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Student</Label>
          <p className="text-sm font-medium">
            {initialData.student?.first_name} {initialData.student?.last_name}
          </p>
        </div>
        <div>
          <Label>Test Date</Label>
          <p className="text-sm font-medium">{initialData.test_date}</p>
        </div>
        <div>
          <Label>Current Belt</Label>
          <Badge variant="outline">{initialData.current_belt}</Badge>
        </div>
        <div>
          <Label>Target Belt</Label>
          <Badge variant="secondary">{initialData.target_belt}</Badge>
        </div>
        <div>
          <Label>Status</Label>
          <Badge variant={initialData.status === 'completed' ? 'outline' : 'secondary'}>
            {initialData.status}
          </Badge>
        </div>
        <div>
          <Label>Result</Label>
          <Badge
            variant={
              initialData.result === 'passed'
                ? 'default'
                : initialData.result === 'failed'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {initialData.result || 'pending'}
          </Badge>
        </div>
      </div>

      {initialData.notes && (
        <div>
          <Label>Notes</Label>
          <p className="text-sm border rounded p-2 bg-muted/50">{initialData.notes}</p>
        </div>
      )}
    </div>
  );
};

interface EvaluateBeltTestFormProps {
  initialData: any;
  evaluators: any[];
  onSubmit: (data: {
    id: string;
    student_id: string;
    target_belt: string;
    result: 'passed' | 'failed';
    notes: string;
    evaluated_by: string;
  }) => void;
  isLoading: boolean;
}

const EvaluateBeltTestForm = ({ initialData, evaluators, onSubmit, isLoading }: EvaluateBeltTestFormProps) => {
  const [formData, setFormData] = useState({
    id: initialData.id,
    student_id: initialData.student_id,
    target_belt: initialData.target_belt,
    result: '' as 'passed' | 'failed' | '',
    notes: initialData.notes || '',
    evaluated_by: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: formData.id,
      student_id: formData.student_id,
      target_belt: formData.target_belt,
      result: formData.result as 'passed' | 'failed',
      notes: formData.notes,
      evaluated_by: formData.evaluated_by,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="font-medium">
          {initialData.student?.first_name} {initialData.student?.last_name}
        </p>
        <p className="text-sm text-muted-foreground">
          Testing for {initialData.target_belt} belt
        </p>
      </div>

      <div>
        <Label htmlFor="result">Test Result</Label>
        <Select value={formData.result} onValueChange={(value: any) => setFormData({ ...formData, result: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="evaluated_by">Evaluator</Label>
        <Select value={formData.evaluated_by} onValueChange={(value) => setFormData({ ...formData, evaluated_by: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select evaluator" />
          </SelectTrigger>
          <SelectContent>
            {evaluators.map((e: any) => (
              <SelectItem key={e.id} value={e.id}>
                {e.first_name} {e.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="evaluation_notes">Evaluation Notes</Label>
        <Textarea
          id="evaluation_notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Feedback and notes from the evaluation..."
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !formData.result}>
        {isLoading ? 'Submitting...' : 'Submit Evaluation'}
      </Button>
    </form>
  );
};

export default BeltTesting;