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
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: string;
  notes: string | null;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  classes?: {
    name: string;
    instructor_id: string;
  };
}

interface AttendanceStats {
  totalSessions: number;
  averageAttendance: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
}

export const AdvancedAttendance = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalSessions: 0,
    averageAttendance: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const { toast } = useToast();

  // New attendance form state
  const [newAttendance, setNewAttendance] = useState({
    student_id: "",
    class_id: "",
    date: "",
    status: "present" as "present" | "absent" | "late" | "excused",
    notes: ""
  });

  useEffect(() => {
    fetchAttendance();
    fetchStats();
  }, []);

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      // Fetch profile and class data separately for each record
      const attendanceWithDetails = await Promise.all(
        (data || []).map(async (record) => {
          const [profileResult, classResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('first_name, last_name, email')
              .eq('id', record.student_id)
              .single(),
            supabase
              .from('classes')
              .select('name, instructor_id')
              .eq('id', record.class_id)
              .single()
          ]);
          
          return {
            ...record,
            profiles: profileResult.data,
            classes: classResult.data
          };
        })
      );
      
      setAttendance(attendanceWithDetails);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('status, date');

      if (error) throw error;

      const totalSessions = data?.length || 0;
      const presentCount = data?.filter(record => record.status === 'present').length || 0;
      const absentCount = data?.filter(record => record.status === 'absent').length || 0;
      const lateCount = data?.filter(record => record.status === 'late').length || 0;
      const averageAttendance = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

      setStats({
        totalSessions,
        averageAttendance,
        presentCount,
        absentCount,
        lateCount
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: newAttendance.student_id,
          class_id: newAttendance.class_id,
          date: newAttendance.date,
          status: newAttendance.status,
          notes: newAttendance.notes || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });

      setShowMarkDialog(false);
      setNewAttendance({ student_id: "", class_id: "", date: "", status: "present", notes: "" });
      fetchAttendance();
      fetchStats();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    }
  };

  const updateAttendanceStatus = async (recordId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ 
          status: newStatus,
          notes: notes || null
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Attendance status updated",
      });

      fetchAttendance();
      fetchStats();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance status",
        variant: "destructive",
      });
    }
  };

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.profiles ? 
      `${record.profiles.first_name} ${record.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
      : false;
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(record.date), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { label: "Present", variant: "default" as const, icon: CheckCircle },
      absent: { label: "Absent", variant: "destructive" as const, icon: XCircle },
      late: { label: "Late", variant: "secondary" as const, icon: Clock },
      excused: { label: "Excused", variant: "outline" as const, icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.present;
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
          <p className="text-muted-foreground">Loading attendance records...</p>
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
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttendance.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lateCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Advanced Attendance Management</CardTitle>
              <CardDescription>
                Track detailed attendance records with notes and status management
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Mark Attendance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                    <DialogDescription>
                      Record attendance for a student in a class session
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student_id">Student ID</Label>
                        <Input
                          id="student_id"
                          value={newAttendance.student_id}
                          onChange={(e) => setNewAttendance({ ...newAttendance, student_id: e.target.value })}
                          placeholder="Enter student ID"
                        />
                      </div>
                      <div>
                        <Label htmlFor="class_id">Class ID</Label>
                        <Input
                          id="class_id"
                          value={newAttendance.class_id}
                          onChange={(e) => setNewAttendance({ ...newAttendance, class_id: e.target.value })}
                          placeholder="Enter class ID"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newAttendance.date}
                          onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={newAttendance.status} onValueChange={(value: any) => setNewAttendance({ ...newAttendance, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={newAttendance.notes}
                        onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                        placeholder="Additional notes about attendance..."
                      />
                    </div>
                    <Button onClick={handleMarkAttendance} className="w-full">
                      Mark Attendance
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
                  placeholder="Search students..."
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
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
                <div className="p-3 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setDateFilter(undefined)}
                    className="w-full"
                  >
                    Clear Filter
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Attendance Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Recorded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.profiles ? 
                            `${record.profiles.first_name} ${record.profiles.last_name}` : 
                            'Unknown Student'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.classes?.name || 'Unknown Class'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate">
                        {record.notes || 'No notes'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.created_at), 'MMM dd, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredAttendance.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No attendance records found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Details Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendance Record Details</DialogTitle>
              <DialogDescription>
                View and update attendance information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student</Label>
                  <p className="text-sm font-medium">
                    {selectedRecord.profiles ? 
                      `${selectedRecord.profiles.first_name} ${selectedRecord.profiles.last_name}` : 
                      'Unknown Student'
                    }
                  </p>
                </div>
                <div>
                  <Label>Class</Label>
                  <p className="text-sm font-medium">{selectedRecord.classes?.name || 'Unknown Class'}</p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p className="text-sm font-medium">{format(new Date(selectedRecord.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label>Current Status</Label>
                  {getStatusBadge(selectedRecord.status)}
                </div>
              </div>
              
              {selectedRecord.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="text-sm border rounded p-2 bg-muted/50">{selectedRecord.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button 
                  size="sm" 
                  onClick={() => updateAttendanceStatus(selectedRecord.id, "present")}
                  variant={selectedRecord.status === "present" ? "default" : "outline"}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Present
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => updateAttendanceStatus(selectedRecord.id, "absent")}
                  variant={selectedRecord.status === "absent" ? "destructive" : "outline"}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Absent
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => updateAttendanceStatus(selectedRecord.id, "late")}
                  variant={selectedRecord.status === "late" ? "secondary" : "outline"}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Late
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => updateAttendanceStatus(selectedRecord.id, "excused")}
                  variant={selectedRecord.status === "excused" ? "outline" : "outline"}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Excused
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};