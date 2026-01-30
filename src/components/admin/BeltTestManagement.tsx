import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Search, 
  Filter, 
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  Star,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

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
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    belt_level?: string;
  };
  evaluator?: {
    id: string;
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

interface PersonOption {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  belt_level?: string;
}

const BELT_LEVELS = [
  "White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Black 1st Dan",
  "Black 2nd Dan", "Black 3rd Dan", "Black 4th Dan", "Black 5th Dan"
];

export const BeltTestManagement = () => {
  const { profile } = useAuth();
  const [beltTests, setBeltTests] = useState<BeltTest[]>([]);
  const [stats, setStats] = useState<BeltTestStats>({
    totalTests: 0,
    scheduledTests: 0,
    passedTests: 0,
    failedTests: 0,
    passRate: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTest, setSelectedTest] = useState<BeltTest | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showEvaluateDialog, setShowEvaluateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [confirmDeleteTest, setConfirmDeleteTest] = useState<BeltTest | null>(null);

  const { data: myBeltTests = [], isLoading: myBeltTestsLoading } = useQuery({
    queryKey: ['my-belt-tests', profile?.id],
    enabled: !!profile?.id && profile?.role === 'student',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('belt_tests')
        .select('id, student_id, current_belt, target_belt, test_date, status, result, notes, evaluated_by, created_at, updated_at')
        .eq('student_id', profile!.id)
        .order('test_date', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as BeltTest[];
      const evaluatorIds = Array.from(
        new Set(rows.map((r) => r.evaluated_by).filter(Boolean))
      ) as string[];

      if (evaluatorIds.length === 0) return rows;

      const { data: evaluatorProfiles, error: evaluatorError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', evaluatorIds);

      if (evaluatorError) throw evaluatorError;

      const byId = new Map<string, { id: string; first_name: string; last_name: string }>();
      for (const p of evaluatorProfiles || []) {
        if (!p?.id) continue;
        byId.set(p.id, {
          id: p.id,
          first_name: (p as any).first_name,
          last_name: (p as any).last_name,
        });
      }

      return rows.map((r) => ({
        ...r,
        evaluator: r.evaluated_by ? byId.get(r.evaluated_by) : undefined,
      }));
    },
  });

  const { data: myBeltHistory = [], isLoading: myBeltHistoryLoading } = useQuery({
    queryKey: ['my-belt-history', profile?.id],
    enabled: !!profile?.id && profile?.role === 'student',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_belt_history')
        .select('id, student_id, belt_level, promoted_date, promoted_by, notes, created_at')
        .eq('student_id', profile!.id)
        .order('promoted_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as any[];
      const promoterIds = Array.from(new Set(rows.map((r) => r.promoted_by).filter(Boolean))) as string[];
      if (promoterIds.length === 0) return rows;

      const { data: promoterProfiles, error: promoterError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .in('id', promoterIds);

      if (promoterError) throw promoterError;

      const byId = new Map<string, { id: string; first_name: string; last_name: string; role?: string }>();
      for (const p of promoterProfiles || []) {
        if (!p?.id) continue;
        byId.set(p.id, {
          id: p.id,
          first_name: (p as any).first_name,
          last_name: (p as any).last_name,
          role: (p as any).role,
        });
      }

      return rows.map((r) => ({
        ...r,
        promoted_by_profile: r.promoted_by ? byId.get(r.promoted_by) : undefined,
      }));
    },
  });

  if (profile?.role === 'student') {
    const latestPassed = (myBeltTests || []).find((t) => t.result === 'passed');
    const nextScheduled = (myBeltTests || []).find((t) => t.status === 'scheduled');

    const findPromotionForTest = (test: BeltTest) => {
      if (!test || test.result !== 'passed') return null;
      const candidates = (myBeltHistory || []).filter(
        (h: any) => (h?.belt_level || '').toLowerCase() === (test.target_belt || '').toLowerCase()
      );
      if (candidates.length === 0) return null;
      return candidates
        .slice()
        .sort((a: any, b: any) => {
          const ad = a?.promoted_date ? new Date(a.promoted_date).getTime() : 0;
          const bd = b?.promoted_date ? new Date(b.promoted_date).getTime() : 0;
          if (bd !== ad) return bd - ad;
          const ac = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const bc = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return bc - ac;
        })[0];
    };

    const getEvaluatorDisplayName = (test: any) => {
      if (test?.evaluator) return `${test.evaluator.first_name} ${test.evaluator.last_name}`;
      if (!test?.evaluated_by) return test?.result ? 'Not assigned' : 'Awaiting evaluation';

      const id = String(test.evaluated_by);
      if (id === '00000000-0000-0000-0000-000000000096') return 'Academy Staff';
      if (id.startsWith('00000000-0000-0000-0000-')) return 'Academy Staff';
      return 'Evaluator unavailable';
    };

    const beltToClassName = (belt: string) => {
      const v = (belt || '').toLowerCase();
      if (v.includes('white')) return 'bg-gray-100 text-gray-900 border-gray-200';
      if (v.includes('yellow')) return 'bg-yellow-100 text-yellow-900 border-yellow-200';
      if (v.includes('orange')) return 'bg-orange-100 text-orange-900 border-orange-200';
      if (v.includes('green')) return 'bg-green-100 text-green-900 border-green-200';
      if (v.includes('blue')) return 'bg-blue-100 text-blue-900 border-blue-200';
      if (v.includes('purple')) return 'bg-purple-100 text-purple-900 border-purple-200';
      if (v.includes('brown')) return 'bg-amber-100 text-amber-900 border-amber-200';
      if (v.includes('red')) return 'bg-red-100 text-red-900 border-red-200';
      if (v.includes('black')) return 'bg-slate-900 text-white border-slate-900';
      return 'bg-muted text-foreground border-border';
    };

    const BeltBadge = ({ belt }: { belt: string }) => (
      <Badge variant="outline" className={beltToClassName(belt)}>
        {belt}
      </Badge>
    );

    const getStatusBadge = (status: string) => {
      const v = (status || '').toLowerCase();
      if (v === 'scheduled') {
        return (
          <Badge variant="outline" className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Scheduled
          </Badge>
        );
      }
      if (v === 'completed') {
        return (
          <Badge variant="secondary" className="inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      }
      return <Badge variant="secondary">{status}</Badge>;
    };

    const getResultBadge = (result: string | null) => {
      if (result === 'passed') {
        return (
          <Badge variant="default" className="inline-flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Passed
          </Badge>
        );
      }
      if (result === 'failed') {
        return (
          <Badge variant="destructive" className="inline-flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      }
      return <Badge variant="outline">Pending</Badge>;
    };

    return (
      <div className="space-y-4">
        <Card className={latestPassed ? "border-primary/40" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Belt Promotions
            </CardTitle>
            <CardDescription>
              Your belt test history and promotion status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={latestPassed ? "rounded-lg border bg-primary/5 p-4" : "rounded-lg border bg-muted/30 p-4"}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground">Promotion Status</div>
                  {latestPassed ? (
                    <div className="mt-1">
                      <div className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        PROMOTED
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Promoted to <BeltBadge belt={latestPassed.target_belt} />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-muted-foreground">
                      Keep training. Your next promotion will show here once you pass a belt test.
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {latestPassed ? (
                    <Badge variant="default" className="inline-flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Promoted
                    </Badge>
                  ) : (
                    <Badge variant="outline">In Progress</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Current Belt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{profile?.belt_level || '—'}</div>
                    {profile?.belt_level ? <BeltBadge belt={profile.belt_level} /> : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Next Test</CardTitle>
                </CardHeader>
                <CardContent>
                  {nextScheduled ? (
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(nextScheduled.test_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: <BeltBadge belt={nextScheduled.target_belt} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No scheduled test yet</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(myBeltTests || []).length}</div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Date</TableHead>
                    <TableHead>Target Belt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Evaluator</TableHead>
                    <TableHead>Promoted Date</TableHead>
                    <TableHead>Promoted By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myBeltTestsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (myBeltTests || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No belt tests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    (myBeltTests || []).map((test) => (
                      (() => {
                        const promo = findPromotionForTest(test);
                        return (
                      <TableRow key={test.id}>
                        <TableCell>{format(new Date(test.test_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <BeltBadge belt={test.target_belt} />
                        </TableCell>
                        <TableCell>{getStatusBadge(test.status)}</TableCell>
                        <TableCell>{getResultBadge(test.result)}</TableCell>
                        <TableCell>
                          {getEvaluatorDisplayName(test)}
                        </TableCell>
                        <TableCell>
                          {promo?.promoted_date
                            ? format(new Date(promo.promoted_date), 'MMM dd, yyyy')
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {promo?.promoted_by_profile
                            ? `${promo.promoted_by_profile.first_name} ${promo.promoted_by_profile.last_name}${promo.promoted_by_profile.role ? ` (${promo.promoted_by_profile.role})` : ''}`
                            : (promo?.promoted_by ? `Promoter unavailable (${String(promo.promoted_by).slice(0, 8)}…)` : <span className="text-muted-foreground">—</span>)}
                        </TableCell>
                        <TableCell>
                          {promo?.notes ? String(promo.notes) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                        );
                      })()
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Access denied. Admin privileges required.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data: students = [] } = useQuery({
    queryKey: ['belt-test-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, belt_level')
        .eq('role', 'student')
        .eq('membership_status', 'active')
        .order('first_name');
      if (error) throw error;
      return (data || []) as PersonOption[];
    }
  });

  const deleteTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const { error } = await supabase
        .from('belt_tests')
        .delete()
        .eq('id', testId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['belt-tests-management'] });
      toast({
        title: "Deleted",
        description: "Belt test deleted successfully",
      });
      if (selectedTest?.id === deletingTestId) {
        setSelectedTest(null);
        setShowEvaluateDialog(false);
      }
      setDeletingTestId(null);
    },
    onError: (error: any) => {
      console.error('Error deleting belt test:', error);
      toast({
        title: "Error",
        description: "Failed to delete belt test",
        variant: "destructive",
      });
      setDeletingTestId(null);
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
      return (data || []) as PersonOption[];
    }
  });

  const { isLoading } = useQuery({
    queryKey: ['belt-tests-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('belt_tests')
        .select('*')
        .order('test_date', { ascending: false });

      if (error) throw error;

      const testsWithDetails = await Promise.all(
        (data || []).map(async (test) => {
          const [profileResult, evaluatorResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, first_name, last_name, email, belt_level')
              .eq('id', test.student_id)
              .single(),
            test.evaluated_by ? supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .eq('id', test.evaluated_by)
              .single() : Promise.resolve({ data: null })
          ]);

          return {
            ...test,
            profiles: profileResult.data,
            evaluator: evaluatorResult.data
          } as BeltTest;
        })
      );

      setBeltTests(testsWithDetails);

      const totalTests = testsWithDetails.length;
      const scheduledTests = testsWithDetails.filter(test => test.status === 'scheduled').length;
      const passedTests = testsWithDetails.filter(test => test.result === 'passed').length;
      const failedTests = testsWithDetails.filter(test => test.result === 'failed').length;
      const completedTests = passedTests + failedTests;
      const passRate = completedTests > 0 ? (passedTests / completedTests) * 100 : 0;

      setStats({
        totalTests,
        scheduledTests,
        passedTests,
        failedTests,
        passRate,
      });

      return testsWithDetails;
    }
  });

  const scheduleTestMutation = useMutation({
    mutationFn: async (payload: typeof newTest) => {
      const { error } = await supabase
        .from('belt_tests')
        .insert({
          student_id: payload.student_id,
          current_belt: payload.current_belt,
          target_belt: payload.target_belt,
          test_date: payload.test_date,
          status: 'scheduled',
          notes: payload.notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['belt-tests-management'] });
      toast({
        title: "Success",
        description: "Belt test scheduled successfully",
      });
      setShowScheduleDialog(false);
      setNewTest({ student_id: "", current_belt: "", target_belt: "", test_date: "", notes: "" });
    },
    onError: (error: any) => {
      console.error('Error scheduling belt test:', error);
      toast({
        title: "Error",
        description: "Failed to schedule belt test",
        variant: "destructive",
      });
    }
  });

  const evaluateTestMutation = useMutation({
    mutationFn: async (payload: { test: BeltTest; evaluation: typeof evaluation }) => {
      const sessionUser = await supabase.auth.getUser();
      const sessionUserId = sessionUser.data.user?.id || null;

      const evaluatedByToSave = payload.evaluation.evaluated_by || sessionUserId;

      const { error } = await supabase
        .from('belt_tests')
        .update({
          status: 'completed',
          result: payload.evaluation.result,
          notes: payload.evaluation.notes || null,
          evaluated_by: evaluatedByToSave || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.test.id);

      if (error) throw error;

      if (payload.evaluation.result === 'passed') {
        let roleAtInsert: string | null = null;
        try {
          const rpcResult = await (supabase as any).rpc('get_current_user_role');
          roleAtInsert = (rpcResult?.data as string | null) || null;
        } catch {
          roleAtInsert = null;
        }

        const promotedByUserId = sessionUserId;
        console.info('student_belt_history insert context', {
          auth_uid: sessionUserId,
          role: roleAtInsert,
          student_id: payload.test.student_id,
          belt_level: payload.test.target_belt,
        });

        const { error: historyError } = await supabase
          .from('student_belt_history')
          .insert({
            student_id: payload.test.student_id,
            belt_level: payload.test.target_belt,
            promoted_by: promotedByUserId,
            notes: payload.evaluation.notes || null,
          });
        if (historyError) throw historyError;

        const { error: beltError } = await supabase
          .from('profiles')
          .update({ belt_level: payload.test.target_belt })
          .eq('id', payload.test.student_id);
        if (beltError) throw beltError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['belt-tests-management'] });
      toast({
        title: "Success",
        description: `Belt test evaluated: ${evaluation.result}`,
      });
      setShowEvaluateDialog(false);
      setSelectedTest(null);
      setEvaluation({ result: "", notes: "", evaluated_by: "" });
    },
    onError: (error: any) => {
      console.error('Error evaluating belt test:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate belt test",
        variant: "destructive",
      });
    }
  });

  const filteredTests = beltTests.filter(test => {
    const matchesSearch = test.profiles ? 
      `${test.profiles.first_name} ${test.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (test.profiles.email ? test.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      test.target_belt.toLowerCase().includes(searchTerm.toLowerCase())
      : test.target_belt.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || test.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
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
                      <Label htmlFor="student_id">Student</Label>
                      <Select
                        value={newTest.student_id}
                        onValueChange={(value) => {
                          const student = students.find((s) => s.id === value);
                          setNewTest({
                            ...newTest,
                            student_id: value,
                            current_belt: student?.belt_level || newTest.current_belt,
                          });
                        }}
                      >
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
                    <Button
                      onClick={() => scheduleTestMutation.mutate(newTest)}
                      className="w-full"
                      disabled={!newTest.student_id || !newTest.current_belt || !newTest.target_belt || !newTest.test_date || scheduleTestMutation.isPending}
                    >
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
                    <TableCell>
                      <Badge variant="secondary">{test.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {test.result === 'passed' ? 
                        <Badge variant="default">Passed</Badge> : 
                        test.result === 'failed' ? 
                        <Badge variant="destructive">Failed</Badge> : 
                        <span className="text-sm text-muted-foreground">Pending</span>
                      }
                    </TableCell>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deleteTestMutation.isPending && deletingTestId === test.id}
                          onClick={() => {
                            setConfirmDeleteTest(test);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <AlertDialog
            open={!!confirmDeleteTest}
            onOpenChange={(open) => {
              if (!open) setConfirmDeleteTest(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Belt Test</AlertDialogTitle>
                <AlertDialogDescription>
                  Delete this belt test? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>No</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (!confirmDeleteTest?.id) return;
                    setDeletingTestId(confirmDeleteTest.id);
                    deleteTestMutation.mutate(confirmDeleteTest.id);
                    setConfirmDeleteTest(null);
                  }}
                >
                  Yes
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                  <Badge variant="secondary">{selectedTest.status}</Badge>
                </div>
                <div>
                  <Label>Result</Label>
                  {selectedTest.result === 'passed' ? 
                    <Badge variant="default">Passed</Badge> : 
                    selectedTest.result === 'failed' ? 
                    <Badge variant="destructive">Failed</Badge> : 
                    <span className="text-sm text-muted-foreground">Pending</span>
                  }
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
                <Label htmlFor="evaluated_by">Evaluator</Label>
                <Select value={evaluation.evaluated_by} onValueChange={(value) => setEvaluation({ ...evaluation, evaluated_by: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select evaluator" />
                  </SelectTrigger>
                  <SelectContent>
                    {evaluators.map((evaluator) => (
                      <SelectItem key={evaluator.id} value={evaluator.id}>
                        {evaluator.first_name} {evaluator.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              
              <Button
                onClick={() => evaluateTestMutation.mutate({ test: selectedTest, evaluation })}
                className="w-full"
                disabled={!evaluation.result || evaluateTestMutation.isPending}
              >
                Submit Evaluation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
