import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  } | null;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  roleChanges: number;
  securityEvents: number;
  uniqueUsers: number;
}

export const AuditLogViewer = ({
  userId,
  defaultScope = 'all',
}: {
  userId?: string | null;
  defaultScope?: 'all' | 'mine';
}) => {
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
  const [referenceDisplayMap, setReferenceDisplayMap] = useState<Record<string, string>>({});
  const missingAcademyNamesRpcRef = useRef<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [scope, setScope] = useState<'all' | 'mine'>(defaultScope);
  const { toast } = useToast();

  useEffect(() => {
    const hydrateUser = async () => {
      if (userId) {
        setCurrentUserId(userId);
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('AuditLogViewer: failed to get current user', error);
        setCurrentUserId(null);
        return;
      }
      setCurrentUserId(data.user?.id || null);
    };

    hydrateUser();
  }, [userId]);

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();

    const channel = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'audit_logs' },
        () => {
          fetchAuditLogs();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, scope]);

  const getUserDisplayName = (log: AuditLog) => {
    if (!log.user_id) return 'System';
    const first = log.profiles?.first_name?.trim() || '';
    const last = log.profiles?.last_name?.trim() || '';
    const fullName = `${first} ${last}`.trim();
    if (fullName) return fullName;
    const email = log.profiles?.email?.trim();
    return email || 'Unknown User';
  };

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const isUuid = (value: unknown) => {
    return typeof value === 'string' && uuidRegex.test(value);
  };

  const toDisplayValue = (value: any, fieldKey?: string) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (isUuid(trimmed)) {
        const mapped = referenceDisplayMap[trimmed];
        if (mapped) return mapped;
        const key = (fieldKey || '').toLowerCase();
        if (key === 'user_id') return 'Unknown User';
        if (key.includes('academy_id')) return 'Unknown Academy';
        if (key.endsWith('_id')) return 'Hidden';
        return 'Hidden';
      }
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date) return value.toISOString();

    if (Array.isArray(value)) return value.length === 0 ? '—' : `List (${value.length})`;
    if (typeof value === 'object') return 'Updated';
    return String(value);
  };

  const getReadableFieldLabel = (key: string) => {
    const overrides: Record<string, string> = {
      from_academy_id: 'From Academy',
      to_academy_id: 'To Academy',
      academy_id: 'Academy',
      user_id: 'User',
      switched_at: 'Switched At',
    };
    return overrides[key] || key.split('_').join(' ');
  };

  const getHiddenChangeKeys = () => {
    return new Set<string>(['id']);
  };

  const collectReferenceUuids = (log: AuditLog) => {
    const ids = new Set<string>();
    const scan = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && isUuid(v)) {
          if (k === 'user_id' || k.toLowerCase().endsWith('_id')) ids.add(v);
        }
      }
    };
    scan(log.old_values);
    scan(log.new_values);
    return ids;
  };

  useEffect(() => {
    const hydrateReferenceMap = async () => {
      if (!selectedLog) return;

      const ids = Array.from(collectReferenceUuids(selectedLog));
      if (ids.length === 0) {
        setReferenceDisplayMap({});
        return;
      }

      try {
        const nextMap: Record<string, string> = {};

        let academies: any = null;
        let academiesError: any = null;

        // Cache whether the RPC exists to avoid repeated 404 spam in the browser.
        if (missingAcademyNamesRpcRef.current === null) {
          try {
            missingAcademyNamesRpcRef.current = sessionStorage.getItem('audit:missing_academy_names_rpc') === '1';
          } catch {
            missingAcademyNamesRpcRef.current = false;
          }
        }

        const shouldTryRpc = !missingAcademyNamesRpcRef.current;
        if (shouldTryRpc) {
          const rpcResult = await (supabase as any).rpc('get_academy_names_by_ids', {
            academy_ids: ids,
          });
          academies = rpcResult?.data;
          academiesError = rpcResult?.error;

          const isMissingRpc =
            !!academiesError &&
            (((academiesError as any).status as number | undefined) === 404 ||
              String((academiesError as any).message || '').toLowerCase().includes('not found'));

          if (isMissingRpc) {
            missingAcademyNamesRpcRef.current = true;
            try {
              sessionStorage.setItem('audit:missing_academy_names_rpc', '1');
            } catch {
              // ignore
            }
          }
        }

        const isMissingRpc = missingAcademyNamesRpcRef.current === true;

        if (isMissingRpc || academiesError) {
          // Fallback to direct academies query (may be blocked by RLS; in that case we just won't resolve names).
          const directResult = await supabase
            .from('academies')
            .select('id, name')
            .in('id', ids);

          if (!directResult.error) {
            academies = directResult.data;
            academiesError = null;
          } else if (!isMissingRpc) {
            console.error('AuditLogViewer: failed to hydrate academies reference map', {
              error: academiesError,
              fallbackError: directResult.error,
              ids,
              selectedLogId: selectedLog?.id,
              tableName: selectedLog?.table_name,
            });
          }
        }

        const academiesList = (Array.isArray(academies) ? academies : []) as Array<{
          id?: string;
          name?: string | null;
        }>;
        for (const a of academiesList) {
          if (a?.id) nextMap[a.id] = a.name || 'Academy';
        }

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', ids);
        if (profilesError) {
          console.error('AuditLogViewer: failed to hydrate profiles reference map', {
            error: profilesError,
            ids,
            selectedLogId: selectedLog?.id,
            tableName: selectedLog?.table_name,
          });
        }
        for (const p of profiles || []) {
          if (!p?.id) continue;
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          nextMap[p.id] = name || p.email || 'User';
        }

        setReferenceDisplayMap(nextMap);
      } catch (e) {
        console.error('AuditLogViewer: reference hydration threw', {
          error: e,
          ids,
          selectedLogId: selectedLog?.id,
          tableName: selectedLog?.table_name,
        });
        setReferenceDisplayMap({});
      }
    };

    hydrateReferenceMap();
  }, [selectedLog]);

  const fetchAuditLogs = async () => {
    try {
      const shouldScopeToUser = scope === 'mine' && !!currentUserId;
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (shouldScopeToUser) {
        query = query.eq('user_id', currentUserId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = (data || []) as AuditLog[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];

      const profileMap = new Map<string, { first_name: string; last_name: string; email: string }>();
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles for audit logs:', profilesError);
        } else {
          for (const p of profiles || []) {
            if (!p?.id) continue;
            profileMap.set(p.id, {
              first_name: p.first_name,
              last_name: p.last_name,
              email: p.email,
            });
          }
        }
      }

      setAuditLogs(
        rows.map((log) => ({
          ...log,
          profiles: log.user_id ? profileMap.get(log.user_id) || null : null,
        }))
      );
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
      const shouldScopeToUser = scope === 'mine' && !!currentUserId;
      let query = supabase
        .from('audit_logs')
        .select('action, table_name, user_id, created_at');

      if (shouldScopeToUser) {
        query = query.eq('user_id', currentUserId);
      }

      const { data, error } = await query;

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
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = log.profiles ? 
      getUserDisplayName(log).toLowerCase().includes(normalizedSearch) ||
      (log.profiles.email || '').toLowerCase().includes(normalizedSearch) ||
      log.action.toLowerCase().includes(normalizedSearch) ||
      log.table_name.toLowerCase().includes(normalizedSearch)
      : log.action.toLowerCase().includes(normalizedSearch) ||
        log.table_name.toLowerCase().includes(normalizedSearch);
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(log.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesAction && matchesTable && matchesDate;
  });

  const availableTables = Array.from(
    new Set((auditLogs || []).map((log) => log.table_name).filter(Boolean))
  ).sort();

  const getActionBadge = (action: string, tableName?: string) => {
    if (action === 'create' && tableName === 'academy_switches') {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          Academy Switch
        </Badge>
      );
    }

    if (action === 'login') {
      return (
        <Badge className="flex items-center gap-1 bg-green-600 text-white hover:bg-green-600">
          <User className="h-3 w-3" />
          Login
        </Badge>
      );
    }

    if (action === 'logout') {
      return (
        <Badge className="flex items-center gap-1 bg-red-600 text-white hover:bg-red-600">
          <User className="h-3 w-3" />
          Logout
        </Badge>
      );
    }

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

  const maskId = (id: string | null) => {
    if (!id) return 'N/A';
    const trimmed = String(id);
    if (trimmed.length <= 12) return trimmed;
    return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
  };

  const getFieldChanges = (oldValues: any, newValues: any) => {
    const oldObj = oldValues && typeof oldValues === 'object' ? oldValues : {};
    const newObj = newValues && typeof newValues === 'object' ? newValues : {};
    const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)])).sort();
    const hidden = getHiddenChangeKeys();

    const changes = keys
      .map((key) => {
        const oldVal = (oldObj as any)[key];
        const newVal = (newObj as any)[key];
        if (hidden.has(key)) {
          return { key, oldStr: '', newStr: '', isSame: true };
        }
        const oldStr = toDisplayValue(oldVal, key);
        const newStr = toDisplayValue(newVal, key);
        const isSame = oldStr === newStr;
        return { key, oldStr, newStr, isSame };
      })
      .filter((c) => !c.isSame);

    return changes;
  };

  const getChangeSummary = (log: AuditLog) => {
    if (log.action === 'create') return 'Created record';
    if (log.action === 'delete') return 'Deleted record';
    const changes = getFieldChanges(log.old_values, log.new_values);
    if (changes.length === 0) return 'No changes recorded';
    return `${changes.length} field(s) modified`;
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,User,Action,Table,Record ID,Details\n" +
      filteredLogs.map(log => {
        const user = getUserDisplayName(log);
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
            <Select value={scope} onValueChange={(v) => setScope(v as 'all' | 'mine')}>
              <SelectTrigger className="w-40">
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="mine" disabled={!currentUserId}>My Account</SelectItem>
              </SelectContent>
            </Select>
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
                {availableTables.map((tableName) => (
                  <SelectItem key={tableName} value={tableName}>
                    {tableName}
                  </SelectItem>
                ))}
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
                        <div className="font-medium">{getUserDisplayName(log)}</div>
                        {log.profiles?.email && (
                          <div className="text-sm text-muted-foreground">{log.profiles.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action, log.table_name)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
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
                    {getUserDisplayName(selectedLog)}
                  </p>
                </div>
                <div>
                  <Label>Action</Label>
                  {getActionBadge(selectedLog.action, selectedLog.table_name)}
                </div>
                <div>
                  <Label>Table</Label>
                  {getTableBadge(selectedLog.table_name)}
                </div>
                <div>
                  <Label>Record ID</Label>
                  <p className="text-sm">{maskId(selectedLog.record_id)}</p>
                </div>
                <div>
                  <Label>Summary</Label>
                  <p className="text-sm">{getChangeSummary(selectedLog)}</p>
                </div>
              </div>

              <div>
                <Label>Changes</Label>
                {(() => {
                  const changes = getFieldChanges(selectedLog.old_values, selectedLog.new_values);
                  if (changes.length === 0) {
                    return (
                      <div className="text-sm text-muted-foreground mt-2">
                        No field-level changes recorded.
                      </div>
                    );
                  }

                  const shown = changes.slice(0, 12);
                  const hiddenCount = changes.length - shown.length;

                  return (
                    <div className="mt-2 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Before</TableHead>
                            <TableHead>After</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shown.map((c) => (
                            <TableRow key={c.key}>
                              <TableCell className="font-medium">{getReadableFieldLabel(c.key)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{c.oldStr}</TableCell>
                              <TableCell className="text-sm">{c.newStr}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {hiddenCount > 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                          +{hiddenCount} more change(s) not shown
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};