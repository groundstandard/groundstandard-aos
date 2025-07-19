import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Download, 
  Filter, 
  RefreshCw, 
  Search, 
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  FileText,
  Settings,
  Plus,
  Trash2,
  Edit,
  Send,
  CheckSquare,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format as formatDate, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";

// Custom date range picker component
const DateRangePicker = ({ 
  date, 
  onDateChange, 
  className 
}: {
  date?: DateRange;
  onDateChange: (date?: DateRange) => void;
  className?: string;
}) => {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {formatDate(date.from, "LLL dd, y")} -{" "}
                  {formatDate(date.to, "LLL dd, y")}
                </>
              ) : (
                formatDate(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Enhanced data types
interface ReportFilter {
  dateRange?: DateRange;
  studentIds?: string[];
  classIds?: string[];
  beltLevels?: string[];
  membershipStatus?: string[];
  attendanceStatus?: string[];
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  filters: ReportFilter;
  columns: string[];
  chartType?: 'bar' | 'line' | 'pie';
  createdAt: string;
  lastRun?: string;
}

interface BulkOperation {
  type: 'email' | 'status_update' | 'belt_promotion' | 'class_enrollment';
  targetIds: string[];
  data: any;
}

export const AdvancedReports = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('analytics');
  const [filters, setFilters] = useState<ReportFilter>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [selectedReportColumns, setSelectedReportColumns] = useState<string[]>([]);
  const [bulkOperationDialog, setBulkOperationDialog] = useState(false);
  const [bulkOperationType, setBulkOperationType] = useState<BulkOperation['type']>('email');

  // Quick date range presets
  const datePresets = [
    { label: 'Today', value: { from: new Date(), to: new Date() } },
    { label: 'Yesterday', value: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) } },
    { label: 'Last 7 days', value: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 days', value: { from: subDays(new Date(), 30), to: new Date() } },
    { label: 'This week', value: { from: startOfWeek(new Date()), to: endOfWeek(new Date()) } },
    { label: 'This month', value: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: 'Last month', value: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) } }
  ];

  // Data fetching with advanced filtering
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['advanced-reports', filters, searchQuery],
    queryFn: async () => {
      // Build dynamic query based on filters
      let studentsQuery = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role,
          belt_level,
          membership_status,
          created_at,
          updated_at,
          phone,
          emergency_contact
        `)
        .eq('role', 'member');

      // Apply filters
      if (filters.membershipStatus?.length) {
        studentsQuery = studentsQuery.in('membership_status', filters.membershipStatus);
      }
      if (filters.beltLevels?.length) {
        studentsQuery = studentsQuery.in('belt_level', filters.beltLevels);
      }
      if (searchQuery) {
        studentsQuery = studentsQuery.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data: students } = await studentsQuery;

      // Get classes data
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          skill_level,
          age_group,
          max_students,
          is_active,
          instructor_id,
          created_at
        `);

      // Get enrollment data
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select(`
          id,
          student_id,
          class_id,
          status,
          enrolled_at,
          classes(name),
          profiles(first_name, last_name)
        `);

      // Get attendance data with date filtering
      let attendanceQuery = supabase
        .from('attendance')
        .select(`
          id,
          student_id,
          class_id,
          date,
          status,
          notes,
          classes(name),
          profiles(first_name, last_name)
        `);

      if (filters.dateRange?.from) {
        attendanceQuery = attendanceQuery.gte('date', formatDate(filters.dateRange.from, 'yyyy-MM-dd'));
      }
      if (filters.dateRange?.to) {
        attendanceQuery = attendanceQuery.lte('date', formatDate(filters.dateRange.to, 'yyyy-MM-dd'));
      }
      if (filters.attendanceStatus?.length) {
        attendanceQuery = attendanceQuery.in('status', filters.attendanceStatus);
      }

      const { data: attendance } = await attendanceQuery;

      // Get payment data
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          id,
          student_id,
          amount,
          status,
          payment_method,
          description,
          payment_date,
          profiles(first_name, last_name)
        `);

      return {
        students: students || [],
        classes: classes || [],
        enrollments: enrollments || [],
        attendance: attendance || [],
        payments: payments || []
      };
    }
  });

  // Bulk operations mutation
  const bulkOperationMutation = useMutation({
    mutationFn: async (operation: BulkOperation) => {
      switch (operation.type) {
        case 'email':
          // In a real app, this would send emails via an edge function
          console.log('Sending emails to:', operation.targetIds, 'with data:', operation.data);
          break;
        case 'status_update':
          await supabase
            .from('profiles')
            .update({ membership_status: operation.data.status })
            .in('id', operation.targetIds);
          break;
        case 'belt_promotion':
          await supabase
            .from('profiles')
            .update({ belt_level: operation.data.belt })
            .in('id', operation.targetIds);
          break;
        case 'class_enrollment':
          const enrollmentData = operation.targetIds.map(studentId => ({
            student_id: studentId,
            class_id: operation.data.classId,
            status: 'active'
          }));
          await supabase
            .from('class_enrollments')
            .insert(enrollmentData);
          break;
      }
    },
    onSuccess: () => {
      toast({ title: "Bulk operation completed successfully" });
      queryClient.invalidateQueries({ queryKey: ['advanced-reports'] });
      setSelectedRows([]);
      setBulkOperationDialog(false);
    },
    onError: (error) => {
      toast({ 
        title: "Bulk operation failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Export functionality
  const exportData = (format: 'csv' | 'xlsx' | 'pdf') => {
    const data = reportData?.students || [];
    
    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Belt Level', 'Membership Status', 'Phone', 'Join Date'];
      const csvContent = [
        headers.join(','),
        ...data.map(student => [
          `"${student.first_name} ${student.last_name}"`,
          student.email,
          student.belt_level || 'No Belt',
          student.membership_status,
          student.phone || '',
          formatDate(new Date(student.created_at), 'yyyy-MM-dd')
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `academy-report-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    
    toast({ title: `Report exported as ${format.toUpperCase()}` });
  };

  // Column definitions for custom reports
  const availableColumns = [
    { id: 'name', label: 'Student Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'belt_level', label: 'Belt Level' },
    { id: 'membership_status', label: 'Membership Status' },
    { id: 'created_at', label: 'Join Date' },
    { id: 'last_attendance', label: 'Last Attendance' },
    { id: 'total_classes', label: 'Total Classes Attended' },
    { id: 'payment_status', label: 'Payment Status' },
    { id: 'emergency_contact', label: 'Emergency Contact' }
  ];

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!reportData) return null;

    const totalStudents = reportData.students.length;
    const activeStudents = reportData.students.filter(s => s.membership_status === 'active').length;
    const totalClasses = reportData.classes.length;
    const activeClasses = reportData.classes.filter(c => c.is_active).length;
    const totalAttendance = reportData.attendance.length;
    const presentAttendance = reportData.attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

    // Belt level distribution
    const beltDistribution = reportData.students.reduce((acc: Record<string, number>, student) => {
      const belt = student.belt_level || 'No Belt';
      acc[belt] = (acc[belt] || 0) + 1;
      return acc;
    }, {});

    // Monthly trends (mock data for demonstration)
    const monthlyTrends = {
      newMembers: [12, 15, 18, 22, 25, 28],
      retention: [92, 89, 94, 91, 93, 95],
      attendance: [78, 82, 85, 79, 88, 84],
      revenue: [4200, 4500, 4800, 4300, 5100, 5400]
    };

    return {
      totalStudents,
      activeStudents,
      totalClasses,
      activeClasses,
      attendanceRate,
      beltDistribution,
      monthlyTrends,
      retentionRate: totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0
    };
  }, [reportData]);

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Advanced Reports & Analytics</CardTitle>
              <CardDescription>
                Comprehensive reporting with filtering, bulk operations, and custom analytics
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => refetch()} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => exportData('csv')} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => setIsCreatingReport(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DateRangePicker 
                date={filters.dateRange}
                onDateChange={(dateRange) => setFilters(prev => ({ ...prev, dateRange }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <Select onValueChange={(value) => {
                const preset = datePresets.find(p => p.label === value);
                if (preset) {
                  setFilters(prev => ({ ...prev, dateRange: preset.value }));
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                <SelectContent>
                  {datePresets.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Membership Status</Label>
              <Select onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                membershipStatus: value === 'all' ? [] : [value] 
              }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different report views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        {/* Analytics Overview */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.activeStudents} active members
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.retentionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      Student retention
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.attendanceRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      Average attendance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.activeClasses}</div>
                    <p className="text-xs text-muted-foreground">
                      Out of {analytics.totalClasses} total
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Belt Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Belt Level Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {Object.entries(analytics.beltDistribution).map(([belt, count]) => (
                      <div key={belt} className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground">{belt}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Students Tab with bulk operations */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Students ({reportData?.students.length || 0})</CardTitle>
                <div className="flex gap-2">
                  {selectedRows.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setBulkOperationDialog(true)}
                      size="sm"
                    >
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Bulk Actions ({selectedRows.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRows.length === reportData?.students.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRows(reportData?.students.map(s => s.id) || []);
                            } else {
                              setSelectedRows([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Belt Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRows(prev => [...prev, student.id]);
                              } else {
                                setSelectedRows(prev => prev.filter(id => id !== student.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {student.belt_level || 'No Belt'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.membership_status === 'active' ? 'default' : 'secondary'}>
                            {student.membership_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(parseISO(student.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Classes ({reportData?.classes.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Skill Level</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{cls.skill_level || 'All'}</Badge>
                        </TableCell>
                        <TableCell>{cls.age_group || 'All Ages'}</TableCell>
                        <TableCell>{cls.max_students || 'Unlimited'}</TableCell>
                        <TableCell>
                          <Badge variant={cls.is_active ? 'default' : 'secondary'}>
                            {cls.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(parseISO(cls.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Custom Reports</CardTitle>
                  <CardDescription>Create and manage custom report templates</CardDescription>
                </div>
                <Button onClick={() => setIsCreatingReport(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customReports.map((report) => (
                  <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{report.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {report.description}
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Created: {formatDate(parseISO(report.createdAt), 'MMM dd, yyyy')}
                        {report.lastRun && (
                          <div>Last run: {formatDate(parseISO(report.lastRun), 'MMM dd, yyyy')}</div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Run
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {customReports.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No custom reports created yet. Click "New Report" to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Operations Dialog */}
      <Dialog open={bulkOperationDialog} onOpenChange={setBulkOperationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Operations</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedRows.length} selected students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Operation Type</Label>
              <Select value={bulkOperationType} onValueChange={(value: BulkOperation['type']) => setBulkOperationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Send Email</SelectItem>
                  <SelectItem value="status_update">Update Status</SelectItem>
                  <SelectItem value="belt_promotion">Belt Promotion</SelectItem>
                  <SelectItem value="class_enrollment">Enroll in Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkOperationType === 'email' && (
              <div className="space-y-2">
                <Label>Email Subject</Label>
                <Input placeholder="Enter email subject" />
                <Label>Message</Label>
                <Textarea placeholder="Enter email message" rows={4} />
              </div>
            )}

            {bulkOperationType === 'status_update' && (
              <div>
                <Label>New Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => {
                  bulkOperationMutation.mutate({
                    type: bulkOperationType,
                    targetIds: selectedRows,
                    data: { /* data based on operation type */ }
                  });
                }}
                disabled={bulkOperationMutation.isPending}
                className="flex-1"
              >
                {bulkOperationMutation.isPending ? 'Processing...' : 'Execute'}
              </Button>
              <Button variant="outline" onClick={() => setBulkOperationDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Custom Report Dialog */}
      <Dialog open={isCreatingReport} onOpenChange={setIsCreatingReport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
            <DialogDescription>
              Design a custom report with specific data and visualizations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Report Name</Label>
                <Input placeholder="Enter report name" />
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="Report description" />
              </div>
            </div>

            <div>
              <Label>Select Columns</Label>
              <div className="grid gap-2 md:grid-cols-2 mt-2">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedReportColumns.includes(column.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedReportColumns(prev => [...prev, column.id]);
                        } else {
                          setSelectedReportColumns(prev => prev.filter(id => id !== column.id));
                        }
                      }}
                    />
                    <Label htmlFor={column.id} className="text-sm">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => {
                  // Create the custom report
                  const newReport: CustomReport = {
                    id: Date.now().toString(),
                    name: 'New Report',
                    description: 'Custom report description',
                    filters: {},
                    columns: selectedReportColumns,
                    createdAt: new Date().toISOString()
                  };
                  setCustomReports(prev => [...prev, newReport]);
                  setIsCreatingReport(false);
                  setSelectedReportColumns([]);
                  toast({ title: "Custom report created successfully" });
                }}
                className="flex-1"
              >
                Create Report
              </Button>
              <Button variant="outline" onClick={() => setIsCreatingReport(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};