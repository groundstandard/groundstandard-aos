import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, Clock, Award } from "lucide-react";
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

  // Only allow admin access
  if (profile?.role !== 'admin') {
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
        .eq('role', 'member')
        .eq('membership_status', 'active');
      return data || [];
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
        .insert([testData]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Belt test scheduled successfully!" });
      queryClient.invalidateQueries({ queryKey: ['belt-tests'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error scheduling belt test", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Award className="h-8 w-8 text-primary" />
              Belt Testing
            </h1>
            <p className="text-muted-foreground mt-1">
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
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Ready</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">For promotion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Belt Tests</CardTitle>
            <CardDescription>Students scheduled for belt promotion tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sample data - replace with real data */}
              {[
                { name: "John Smith", currentBelt: "White", targetBelt: "Yellow", date: "2025-08-01", status: "scheduled" },
                { name: "Sarah Johnson", currentBelt: "Yellow", targetBelt: "Orange", date: "2025-08-15", status: "confirmed" },
                { name: "Mike Wilson", currentBelt: "Green", targetBelt: "Blue", date: "2025-08-30", status: "pending" }
              ].map((test, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{test.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {test.currentBelt} → {test.targetBelt} Belt
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={test.status === 'confirmed' ? 'default' : 'secondary'}>
                      {test.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{test.date}</span>
                  </div>
                </div>
              ))}
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

export default BeltTesting;