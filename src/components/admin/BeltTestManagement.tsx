import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Trophy,
  Star,
  Eye,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BeltTest {
  id: string;
  student_id: string;
  current_belt: string;
  target_belt: string;
  test_date: string;
  status: string;
  result: string | null;
  notes: string | null;
  evaluated_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  evaluator?: {
    first_name: string;
    last_name: string;
  };
}

interface BeltTestStats {
  totalTests: number;
  scheduledTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
}

const BELT_LEVELS = [
  "White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Black 1st Dan",
  "Black 2nd Dan", "Black 3rd Dan", "Black 4th Dan", "Black 5th Dan"
];

export const BeltTestManagement = () => {
  const [beltTests, setBeltTests] = useState<BeltTest[]>([]);
  const [stats, setStats] = useState<BeltTestStats>({
    totalTests: 0,
    scheduledTests: 0,
    passedTests: 0,
    failedTests: 0,
    passRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTest, setSelectedTest] = useState<BeltTest | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEvaluateDialog, setShowEvaluateDialog] = useState(false);
  const { toast } = useToast();

  // New belt test form state
  const [newTest, setNewTest] = useState({
    student_id: "",
    current_belt: "",
    target_belt: "",
    test_date: "",
    notes: ""
  });

  // Evaluation form state
  const [evaluation, setEvaluation] = useState({
    result: "" as "passed" | "failed" | "",
    notes: "",
    evaluated_by: ""
  });

  useEffect(() => {
    fetchBeltTests();
    fetchStats();
  }, []);

  const fetchBeltTests = async () => {
    try {
      const { data, error } = await supabase
        .from('belt_tests')
        .select('*')
        .order('test_date', { ascending: false });

      if (error) throw error;
      
      // Fetch profile and evaluator data separately for each test
      const testsWithDetails = await Promise.all(
        (data || []).map(async (test) => {
          const [profileResult, evaluatorResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', test.student_id)
              .single(),
            test.evaluated_by ? supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', test.evaluated_by)
              .single() : Promise.resolve({ data: null })
          ]);
          
          return {
            ...test,
            profiles: profileResult.data,
            evaluator: evaluatorResult.data
          };
        })
      );
      
      setBeltTests(testsWithDetails);
    } catch (error) {
      console.error('Error fetching belt tests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch belt tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('belt_tests')
        .select('status, result');

      if (error) throw error;

      const totalTests = data?.length || 0;
      const scheduledTests = data?.filter(test => test.status === 'scheduled').length || 0;
      const passedTests = data?.filter(test => test.result === 'passed').length || 0;
      const failedTests = data?.filter(test => test.result === 'failed').length || 0;
      const completedTests = passedTests + failedTests;
      const passRate = completedTests > 0 ? (passedTests / completedTests) * 100 : 0;

      setStats({
        totalTests,
        scheduledTests,
        passedTests,
        failedTests,
        passRate
      });
    } catch (error) {
      console.error('Error fetching belt test stats:', error);
    }
  };

  const handleScheduleTest = async () => {
    try {
      const { error } = await supabase
        .from('belt_tests')
        .insert({
          student_id: newTest.student_id,
          current_belt: newTest.current_belt,
          target_belt: newTest.target_belt,
          test_date: newTest.test_date,
          status: 'scheduled',
          notes: newTest.notes || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Belt test scheduled successfully",
      });

      setShowScheduleDialog(false);
      setNewTest({ student_id: "", current_belt: "", target_belt: "", test_date: "", notes: "" });
      fetchBeltTests();
      fetchStats();
    } catch (error) {
      console.error('Error scheduling belt test:', error);
      toast({
        title: "Error",
        description: "Failed to schedule belt test",
        variant: "destructive",
      });
    }
  };

  const handleEvaluateTest = async () => {
    if (!selectedTest) return;

    try {
      const { error } = await supabase
        .from('belt_tests')
        .update({
          status: 'completed',
          result: evaluation.result,
          notes: evaluation.notes || null,
          evaluated_by: evaluation.evaluated_by || null
        })
        .eq('id', selectedTest.id);

      if (error) throw error;

      // If student passed, update their belt level in profiles
      if (evaluation.result === 'passed') {
        await supabase
          .from('profiles')
          .update({ belt_level: selectedTest.target_belt })
          .eq('id', selectedTest.student_id);
      }

      toast({
        title: "Success",
        description: `Belt test evaluated: ${evaluation.result}`,
      });

      setShowEvaluateDialog(false);
      setSelectedTest(null);
      setEvaluation({ result: "", notes: "", evaluated_by: "" });
      fetchBeltTests();
      fetchStats();
    } catch (error) {
      console.error('Error evaluating belt test:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate belt test",
        variant: "destructive",
      });
    }
  };

  const filteredTests = beltTests.filter(test => {
    const matchesSearch = test.profiles ? 
      `${test.profiles.first_name} ${test.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.target_belt.toLowerCase().includes(searchTerm.toLowerCase())
      : test.target_belt.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || test.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Scheduled", variant: "secondary" as const, icon: Clock },
      in_progress: { label: "In Progress", variant: "default" as const, icon: Award },
      completed: { label: "Completed", variant: "outline" as const, icon: CheckCircle },
      cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getResultBadge = (result: string | null) => {
    if (!result) return null;
    
    const resultConfig = {
      passed: { label: "Passed", variant: "default" as const, icon: Trophy },
      failed: { label: "Failed", variant: "destructive" as const, icon: XCircle }
    };
    
    const config = resultConfig[result as keyof typeof resultConfig];
    if (!config) return null;
    
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading belt tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Belt Test Management</CardTitle>
              <CardDescription>
                Schedule and manage belt testing for students
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Test
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Belt Test</DialogTitle>
                    <DialogDescription>
                      Schedule a new belt test for a student
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="student_id">Student ID</Label>
                      <Input
                        id="student_id"
                        value={newTest.student_id}
                        onChange={(e) => setNewTest({ ...newTest, student_id: e.target.value })}
                        placeholder="Enter student ID"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="current_belt">Current Belt</Label>
                        <Select value={newTest.current_belt} onValueChange={(value) => setNewTest({ ...newTest, current_belt: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select current belt" />
                          </SelectTrigger>
                          <SelectContent>
                            {BELT_LEVELS.map(belt => (
                              <SelectItem key={belt} value={belt}>{belt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="target_belt">Target Belt</Label>
                        <Select value={newTest.target_belt} onValueChange={(value) => setNewTest({ ...newTest, target_belt: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target belt" />
                          </SelectTrigger>
                          <SelectContent>
                            {BELT_LEVELS.map(belt => (
                              <SelectItem key={belt} value={belt}>{belt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="test_date">Test Date</Label>
                      <Input
                        id="test_date"
                        type="date"
                        value={newTest.test_date}
                        onChange={(e) => setNewTest({ ...newTest, test_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={newTest.notes}
                        onChange={(e) => setNewTest({ ...newTest, notes: e.target.value })}
                        placeholder="Additional notes for the test..."
                      />
                    </div>
                    <Button onClick={handleScheduleTest} className="w-full">
                      Schedule Test
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students or belt levels..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
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

          {/* Belt Tests Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Current Belt</TableHead>
                  <TableHead>Target Belt</TableHead>
                  <TableHead>Test Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Evaluator</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {test.profiles ? 
                            `${test.profiles.first_name} ${test.profiles.last_name}` : 
                            'Unknown Student'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {test.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{test.current_belt}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{test.target_belt}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(test.test_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(test.status)}</TableCell>
                    <TableCell>{getResultBadge(test.result)}</TableCell>
                    <TableCell>
                      {test.evaluator ? 
                        `${test.evaluator.first_name} ${test.evaluator.last_name}` : 
                        'Not assigned'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTest(test)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {test.status === 'scheduled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTest(test);
                              setShowEvaluateDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTests.length === 0 && (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No belt tests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Details Dialog */}
      {selectedTest && !showEvaluateDialog && (
        <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Belt Test Details</DialogTitle>
              <DialogDescription>
                Complete information about this belt test
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student</Label>
                  <p className="text-sm font-medium">
                    {selectedTest.profiles ? 
                      `${selectedTest.profiles.first_name} ${selectedTest.profiles.last_name}` : 
                      'Unknown Student'
                    }
                  </p>
                </div>
                <div>
                  <Label>Test Date</Label>
                  <p className="text-sm font-medium">{format(new Date(selectedTest.test_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label>Current Belt</Label>
                  <Badge variant="outline">{selectedTest.current_belt}</Badge>
                </div>
                <div>
                  <Label>Target Belt</Label>
                  <Badge variant="secondary">{selectedTest.target_belt}</Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  {getStatusBadge(selectedTest.status)}
                </div>
                <div>
                  <Label>Result</Label>
                  {getResultBadge(selectedTest.result) || <span className="text-sm text-muted-foreground">Pending</span>}
                </div>
              </div>
              
              {selectedTest.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm border rounded p-2 bg-muted/50">{selectedTest.notes}</p>
                </div>
              )}
              
              {selectedTest.evaluator && (
                <div>
                  <Label>Evaluated By</Label>
                  <p className="text-sm font-medium">
                    {`${selectedTest.evaluator.first_name} ${selectedTest.evaluator.last_name}`}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Evaluate Test Dialog */}
      {showEvaluateDialog && selectedTest && (
        <Dialog open={showEvaluateDialog} onOpenChange={setShowEvaluateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Evaluate Belt Test</DialogTitle>
              <DialogDescription>
                Record the results of the belt test
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">
                  {selectedTest.profiles ? 
                    `${selectedTest.profiles.first_name} ${selectedTest.profiles.last_name}` : 
                    'Unknown Student'
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  Testing for {selectedTest.target_belt} belt
                </p>
              </div>
              
              <div>
                <Label htmlFor="result">Test Result</Label>
                <Select value={evaluation.result} onValueChange={(value: any) => setEvaluation({ ...evaluation, result: value })}>
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
                <Label htmlFor="evaluated_by">Evaluator ID</Label>
                <Input
                  id="evaluated_by"
                  value={evaluation.evaluated_by}
                  onChange={(e) => setEvaluation({ ...evaluation, evaluated_by: e.target.value })}
                  placeholder="Enter evaluator ID"
                />
              </div>
              
              <div>
                <Label htmlFor="evaluation_notes">Evaluation Notes</Label>
                <Textarea
                  id="evaluation_notes"
                  value={evaluation.notes}
                  onChange={(e) => setEvaluation({ ...evaluation, notes: e.target.value })}
                  placeholder="Feedback and notes from the evaluation..."
                />
              </div>
              
              <Button onClick={handleEvaluateTest} className="w-full" disabled={!evaluation.result}>
                Submit Evaluation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};