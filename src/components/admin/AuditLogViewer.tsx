import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Shield,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  User,
  Database
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  roleChanges: number;
  securityEvents: number;
  uniqueUsers: number;
}

export const AuditLogViewer = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    todayLogs: 0,
    roleChanges: 0,
    securityEvents: 0,
    uniqueUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Limit to recent logs for performance

      if (error) throw error;
      
      // Fetch profile data separately for each log
      const logsWithProfiles = await Promise.all(
        (data || []).map(async (log) => {
          if (!log.user_id) return { ...log, profiles: null };
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', log.user_id)
            .single();
          
          return {
            ...log,
            profiles: profile
          };
        })
      );
      
      setAuditLogs(logsWithProfiles);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, table_name, user_id, created_at');

      if (error) throw error;

      const totalLogs = data?.length || 0;
      const today = new Date().toDateString();
      const todayLogs = data?.filter(log => 
        new Date(log.created_at).toDateString() === today
      ).length || 0;
      
      const roleChanges = data?.filter(log => log.action === 'role_change').length || 0;
      const securityEvents = data?.filter(log => 
        ['login_failed', 'unauthorized_access', 'permission_denied'].includes(log.action)
      ).length || 0;
      
      const uniqueUsers = new Set(data?.map(log => log.user_id).filter(Boolean)).size || 0;

      setStats({
        totalLogs,
        todayLogs,
        roleChanges,
        securityEvents,
        uniqueUsers
      });
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.profiles ? 
      `${log.profiles.first_name} ${log.profiles.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase())
      : log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(log.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesAction && matchesTable && matchesDate;
  });

  const getActionBadge = (action: string) => {
    const actionConfig = {
      role_change: { label: "Role Change", variant: "destructive" as const, icon: AlertTriangle },
      create: { label: "Create", variant: "default" as const, icon: CheckCircle },
      update: { label: "Update", variant: "secondary" as const, icon: Settings },
      delete: { label: "Delete", variant: "destructive" as const, icon: XCircle },
      login: { label: "Login", variant: "outline" as const, icon: User },
      logout: { label: "Logout", variant: "outline" as const, icon: User }
    };
    
    const config = actionConfig[action as keyof typeof actionConfig] || {
      label: action, variant: "outline" as const, icon: Database
    };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTableBadge = (tableName: string) => {
    const tableConfig = {
      profiles: { color: "bg-blue-100 text-blue-800" },
      classes: { color: "bg-green-100 text-green-800" },
      attendance: { color: "bg-yellow-100 text-yellow-800" },
      payments: { color: "bg-purple-100 text-purple-800" },
      events: { color: "bg-pink-100 text-pink-800" }
    };
    
    const config = tableConfig[tableName as keyof typeof tableConfig] || {
      color: "bg-gray-100 text-gray-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {tableName}
      </span>
    );
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,User,Action,Table,Record ID,Details\n" +
      filteredLogs.map(log => {
        const user = log.profiles ? `${log.profiles.first_name} ${log.profiles.last_name}` : 'System';
        const timestamp = format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss');
        const details = log.new_values ? JSON.stringify(log.new_values).replace(/"/g, '""') : '';
        return `"${timestamp}","${user}","${log.action}","${log.table_name}","${log.record_id || ''}","${details}"`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
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
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayLogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Changes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.roleChanges}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.securityEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Log Viewer</CardTitle>
              <CardDescription>
                Monitor system activities and security events
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="role_change">Role Changes</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-40">
                <Database className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="profiles">Profiles</SelectItem>
                <SelectItem value="classes">Classes</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="events">Events</SelectItem>
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
                  className={cn("p-3 pointer-events-auto")}
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

          {/* Audit Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Changes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {log.profiles ? 
                            `${log.profiles.first_name} ${log.profiles.last_name}` : 
                            'System'
                          }
                        </div>
                        {log.profiles && (
                          <div className="text-sm text-muted-foreground">
                            {log.profiles.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getTableBadge(log.table_name)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.record_id ? log.record_id.slice(0, 8) + '...' : 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm">
                        {log.new_values ? 
                          Object.keys(log.new_values).length + ' field(s) modified' : 
                          'No changes recorded'
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                Complete information about this audit event
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm font-mono">
                    {format(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <Label>User</Label>
                  <p className="text-sm font-medium">
                    {selectedLog.profiles ? 
                      `${selectedLog.profiles.first_name} ${selectedLog.profiles.last_name}` : 
                      'System'
                    }
                  </p>
                </div>
                <div>
                  <Label>Action</Label>
                  {getActionBadge(selectedLog.action)}
                </div>
                <div>
                  <Label>Table</Label>
                  {getTableBadge(selectedLog.table_name)}
                </div>
                <div>
                  <Label>Record ID</Label>
                  <p className="text-sm font-mono">{selectedLog.record_id || 'N/A'}</p>
                </div>
              </div>
              
              {selectedLog.old_values && (
                <div>
                  <Label>Previous Values</Label>
                  <pre className="text-xs bg-muted p-3 rounded border overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}
              
              {selectedLog.new_values && (
                <div>
                  <Label>New Values</Label>
                  <pre className="text-xs bg-muted p-3 rounded border overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};