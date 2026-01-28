import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Shield,
  Eye,
  Trash2,
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

import type { Database as SupabaseDatabase } from "@/integrations/supabase/types";

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
    role?: string;
    academy_id?: string | null;
    last_academy_id?: string | null;
    academy_name?: string | null;
  } | null;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  roleChanges: number;
  securityEvents: number;
  uniqueUsers: number;
}

interface GroupedAuditRow {
  key: string;
  user_id: string | null;
  logs: AuditLog[];
  latest_at: string;
  profiles: AuditLog['profiles'];
}

type ProfilesInsert = SupabaseDatabase['public']['Tables']['profiles']['Insert'];

export const AuditLogViewer = ({
  userId,
  defaultScope = 'all',
}: {
  userId?: string | null;
  defaultScope?: 'all' | 'mine';
}) => {
  const { onlineUserIds, onlineAtByUserId } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createUserSaving, setCreateUserSaving] = useState(false);
  const [createUserAcademies, setCreateUserAcademies] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState('student');
  const [newUserMembershipStatus, setNewUserMembershipStatus] = useState('inactive');
  const [newUserAcademyId, setNewUserAcademyId] = useState<string | null>(null);
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
  const [selectedGroup, setSelectedGroup] = useState<GroupedAuditRow | null>(null);
  const [referenceDisplayMap, setReferenceDisplayMap] = useState<Record<string, string>>({});
  const missingAcademyNamesRpcRef = useRef<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null);
  const [scope, setScope] = useState<'all' | 'mine'>(defaultScope);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState<{ id: string; label: string } | null>(null);
  const [confirmDeleteAlsoLogs, setConfirmDeleteAlsoLogs] = useState(false);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState<Date | undefined>(undefined);
  const [historySelectedIds, setHistorySelectedIds] = useState<Set<string>>(new Set());
  const [historyDeleting, setHistoryDeleting] = useState(false);
  const [historyClassNameById, setHistoryClassNameById] = useState<Record<string, string>>({});
  const [historyClassInstructorById, setHistoryClassInstructorById] = useState<Record<string, string>>({});
  const [historyClassDayOfWeekById, setHistoryClassDayOfWeekById] = useState<Record<string, number>>({});
  const [historyProfileNameById, setHistoryProfileNameById] = useState<Record<string, string>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
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

  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, actionFilter, tableFilter, dateFilter, scope, currentUserId]);

  useEffect(() => {
    setHistorySearchTerm('');
    setHistoryDateFilter(undefined);
    setHistorySelectedIds(new Set());
    setHistoryClassNameById({});
    setHistoryClassInstructorById({});
    setHistoryClassDayOfWeekById({});
    setHistoryProfileNameById({});
  }, [selectedGroup?.key]);

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
    return new Set<string>([
      'id',
      'updated_at',
      'created_at',
      'last_seen_at',
      'last_login_at',
    ]);
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

      const profileMap = new Map<
        string,
        {
          first_name: string;
          last_name: string;
          email: string;
          role?: string;
          academy_id?: string | null;
          last_academy_id?: string | null;
          academy_name?: string | null;
        }
      >();
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, role, academy_id, last_academy_id')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles for audit logs:', profilesError);
        } else {
          const academyIds = Array.from(
            new Set(
              (profiles || [])
                .map((p: any) => p?.last_academy_id || p?.academy_id)
                .filter(Boolean)
            )
          ) as string[];

          const academyNameById = new Map<string, string>();
          if (academyIds.length > 0) {
            const { data: academies, error: academiesError } = await supabase
              .from('academies')
              .select('id, name')
              .in('id', academyIds);
            if (academiesError) {
              console.error('Error fetching academies for audit logs:', academiesError);
            } else {
              for (const a of academies || []) {
                if (a?.id && a?.name) academyNameById.set(a.id, a.name);
              }
            }
          }

          for (const p of profiles || []) {
            if (!p?.id) continue;
            const academyId = (p as any).last_academy_id || (p as any).academy_id || null;
            profileMap.set(p.id, {
              first_name: p.first_name,
              last_name: p.last_name,
              email: p.email,
              role: (p as any).role,
              academy_id: (p as any).academy_id,
              last_academy_id: (p as any).last_academy_id,
              academy_name: academyId ? academyNameById.get(academyId) || null : null,
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

  const normalizeAction = (value: string | null | undefined) => {
    const raw = (value || '').trim().toLowerCase();
    const compact = raw.replace(/\s+/g, '_');
    if (compact === 'insert') return 'create';
    return compact;
  };

  const isUserOnline = (id: string | null | undefined) => {
    if (!id) return false;
    if (id === currentUserId) return true;
    return onlineUserIds.has(id);
  };

  const getOnlineDurationLabel = (id: string | null | undefined) => {
    if (!id) return null;
    const onlineAt = onlineAtByUserId[id];
    if (!onlineAt) return null;
    const ms = Date.now() - new Date(onlineAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const lastLogoutAtByUserId = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const l of auditLogs) {
      const userId = l.user_id;
      if (!userId) continue;
      const normalized = normalizeAction(l.action);
      if (normalized !== 'logout') continue;
      const current = m[userId];
      if (!current || new Date(l.created_at).getTime() > new Date(current).getTime()) {
        m[userId] = l.created_at;
      }
    }
    return m;
  }, [auditLogs]);

  const lastLoginAtByUserId = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const l of auditLogs) {
      const userId = l.user_id;
      if (!userId) continue;
      const normalized = normalizeAction(l.action);
      if (normalized !== 'login') continue;
      const current = m[userId];
      if (!current || new Date(l.created_at).getTime() > new Date(current).getTime()) {
        m[userId] = l.created_at;
      }
    }
    return m;
  }, [auditLogs]);

  const getOfflineDurationLabel = (id: string | null | undefined) => {
    if (!id) return null;
    const baseAt = lastLogoutAtByUserId[id] || lastLoginAtByUserId[id];
    if (!baseAt) return null;
    const ms = Date.now() - new Date(baseAt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    if (ms > 24 * 60 * 60 * 1000) return null;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
    
    const matchesAction =
      actionFilter === "all" ||
      (actionFilter === 'login'
        ? isUserOnline(log.user_id)
        : actionFilter === 'logout'
          ? !isUserOnline(log.user_id)
          : normalizeAction(log.action) === actionFilter);
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(log.created_at), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    
    return matchesSearch && matchesAction && matchesTable && matchesDate;
  });

  const groupedRows = useMemo<GroupedAuditRow[]>(() => {
    const map = new Map<string, GroupedAuditRow>();

    for (const log of filteredLogs) {
      const key = log.user_id || 'system';
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          user_id: log.user_id,
          logs: [log],
          latest_at: log.created_at,
          profiles: log.profiles || null,
        });
      } else {
        existing.logs.push(log);
        if (new Date(log.created_at).getTime() > new Date(existing.latest_at).getTime()) {
          existing.latest_at = log.created_at;
        }
        if (!existing.profiles && log.profiles) {
          existing.profiles = log.profiles;
        }
      }
    }

    const rows = Array.from(map.values());
    rows.sort((a, b) => new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime());
    for (const r of rows) {
      r.logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return rows;
  }, [filteredLogs]);

  const totalPages = Math.max(1, Math.ceil(groupedRows.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const pagedRows = groupedRows.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize);

  const visibleLogIds = pagedRows.flatMap((r) => r.logs.map((l) => l.id));
  const allVisibleSelected =
    visibleLogIds.length > 0 && visibleLogIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleLogIds.some((id) => selectedIds.has(id));
  const selectAllState: boolean | "indeterminate" = allVisibleSelected
    ? true
    : someVisibleSelected
      ? "indeterminate"
      : false;

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleLogIds) next.delete(id);
      } else {
        for (const id of visibleLogIds) next.add(id);
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (ids: string[]) => {
    if (ids.length === 0) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setDeleting(true);
    try {
      const { error } = await supabase.from('audit_logs').delete().in('id', ids);
      if (error) throw error;

      toast({
        title: 'Deleted',
        description: `${ids.length} audit log(s) deleted`,
      });

      setSelectedIds(new Set());
      await fetchAuditLogs();
      await fetchStats();
    } catch (error) {
      console.error('Error deleting audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete selected audit logs',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

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
        <Badge className="flex items-center gap-1 bg-gray-900 text-white hover:bg-gray-900">
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

  const historyFilteredLogs = useMemo(() => {
    if (!selectedGroup) return [] as AuditLog[];
    const normalizedSearch = historySearchTerm.trim().toLowerCase();
    return selectedGroup.logs.filter((l) => {
      const createdAt = new Date(l.created_at);
      const dateStamp = format(createdAt, 'yyyy-MM-dd');
      const fullStamp = format(createdAt, 'MMM dd, yyyy HH:mm:ss').toLowerCase();
      const dayStamp = format(createdAt, 'MMM dd, yyyy').toLowerCase();
      const iso = (l.created_at || '').toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        normalizeAction(l.action).includes(normalizedSearch) ||
        (l.table_name || '').toLowerCase().includes(normalizedSearch) ||
        getChangeSummary(l).toLowerCase().includes(normalizedSearch) ||
        dateStamp.includes(normalizedSearch) ||
        fullStamp.includes(normalizedSearch) ||
        dayStamp.includes(normalizedSearch) ||
        iso.includes(normalizedSearch);

      const matchesDate =
        !historyDateFilter ||
        format(createdAt, 'yyyy-MM-dd') === format(historyDateFilter, 'yyyy-MM-dd');

      return matchesSearch && matchesDate;
    });
  }, [selectedGroup, historySearchTerm, historyDateFilter]);

  const historyGroupedRows = useMemo(() => {
    const rows: Array<{ key: string; created_at: string; logs: AuditLog[] }> = [];
    const indexByKey = new Map<string, number>();

    for (const l of historyFilteredLogs) {
      const createdAt = new Date(l.created_at);
      const timeKey = Number.isFinite(createdAt.getTime()) ? format(createdAt, 'yyyy-MM-dd HH:mm:ss') : l.created_at;

      const existingIdx = indexByKey.get(timeKey);
      if (typeof existingIdx === 'number') {
        rows[existingIdx].logs.push(l);
      } else {
        indexByKey.set(timeKey, rows.length);
        rows.push({
          key: timeKey,
          created_at: l.created_at,
          logs: [l],
        });
      }
    }

    return rows;
  }, [historyFilteredLogs]);

  const historyVisibleRows = useMemo(() => {
    return historyGroupedRows.slice(0, 100);
  }, [historyGroupedRows]);

  const historyVisibleIds = useMemo(
    () => historyVisibleRows.flatMap((r) => r.logs.map((l) => l.id)),
    [historyVisibleRows]
  );

  const historyAllVisibleSelected =
    historyVisibleIds.length > 0 && historyVisibleIds.every((id) => historySelectedIds.has(id));
  const historySomeVisibleSelected = historyVisibleIds.some((id) => historySelectedIds.has(id));
  const historySelectAllState: boolean | 'indeterminate' = historyAllVisibleSelected
    ? true
    : historySomeVisibleSelected
      ? 'indeterminate'
      : false;

  const toggleSelectAllHistoryVisible = () => {
    setHistorySelectedIds((prev) => {
      const next = new Set(prev);
      if (historyAllVisibleSelected) {
        for (const id of historyVisibleIds) next.delete(id);
      } else {
        for (const id of historyVisibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleSelectHistoryMany = (ids: string[]) => {
    setHistorySelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  };

  const deleteHistorySelected = async () => {
    const ids = Array.from(historySelectedIds);
    if (ids.length === 0) return;
    const ok = window.confirm(`Delete ${ids.length} selected history item(s)?`);
    if (!ok) return;

    setHistoryDeleting(true);
    try {
      const { error } = await supabase.from('audit_logs').delete().in('id', ids);
      if (error) throw error;
      toast({ title: 'Deleted', description: `${ids.length} history item(s) deleted` });
      setHistorySelectedIds(new Set());
      await fetchAuditLogs();
      await fetchStats();
      setSelectedGroup(null);
    } catch (error) {
      console.error('Error deleting history items:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete history items',
        variant: 'destructive',
      });
    } finally {
      setHistoryDeleting(false);
    }
  };

  useEffect(() => {
    const hydrateHistoryReferences = async () => {
      if (!selectedGroup) return;

      const classIds = new Set<string>();
      const profileIds = new Set<string>();

      for (const l of selectedGroup.logs) {
        const newObj = l.new_values && typeof l.new_values === 'object' ? l.new_values : null;
        const oldObj = l.old_values && typeof l.old_values === 'object' ? l.old_values : null;

        const classId = (newObj?.class_id || oldObj?.class_id) as unknown;
        const studentId = (newObj?.student_id || oldObj?.student_id) as unknown;
        const instructorId = (newObj?.instructor_id || oldObj?.instructor_id) as unknown;

        if (typeof classId === 'string' && isUuid(classId)) classIds.add(classId);
        if (typeof studentId === 'string' && isUuid(studentId)) profileIds.add(studentId);
        if (typeof instructorId === 'string' && isUuid(instructorId)) profileIds.add(instructorId);
      }

      try {
        if (classIds.size > 0) {
          const { data: classes, error } = await supabase
            .from('classes')
            .select(
              `
              id,
              name,
              class_schedules(day_of_week),
              instructor:profiles!classes_instructor_id_fkey(first_name, last_name)
            `
            )
            .in('id', Array.from(classIds));
          if (!error) {
            const m: Record<string, string> = {};
            const instructorMap: Record<string, string> = {};
            const dayOfWeekMap: Record<string, number> = {};
            for (const c of classes || []) {
              if (!c?.id) continue;
              m[c.id] = c.name || 'Class';
              const instructor = (c as any).instructor as { first_name?: string | null; last_name?: string | null } | null;
              const instructorName = instructor ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() : '';
              if (instructorName) instructorMap[c.id] = instructorName;
              const schedules = (c as any).class_schedules as Array<{ day_of_week?: number | null }> | null;
              const firstDay = schedules && schedules.length > 0 ? schedules[0]?.day_of_week : null;
              if (typeof firstDay === 'number') dayOfWeekMap[c.id] = firstDay;
            }
            setHistoryClassNameById(m);
            setHistoryClassInstructorById(instructorMap);
            setHistoryClassDayOfWeekById(dayOfWeekMap);
          }
        }

        if (profileIds.size > 0) {
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', Array.from(profileIds));
          if (!error) {
            const m: Record<string, string> = {};
            for (const p of profiles || []) {
              if (!p?.id) continue;
              const name = `${p.first_name || ''} ${p.last_name || ''}`.trim();
              m[p.id] = name || p.email || 'User';
            }
            setHistoryProfileNameById(m);
          }
        }
      } catch {
        // ignore hydration errors for history modal
      }
    };

    hydrateHistoryReferences();
  }, [selectedGroup]);

  const getHistoryEntityLabel = (log: AuditLog) => {
    const newObj = log.new_values && typeof log.new_values === 'object' ? log.new_values : null;
    const oldObj = log.old_values && typeof log.old_values === 'object' ? log.old_values : null;

    const dayName = (day: number | undefined) => {
      const m = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return typeof day === 'number' && day >= 0 && day <= 6 ? m[day] : null;
    };

    const computeNextOccurrenceDate = (base: Date, targetDayOfWeek: number) => {
      const normalizedBase = new Date(base);
      normalizedBase.setHours(0, 0, 0, 0);
      const baseDow = normalizedBase.getDay();
      const delta = (targetDayOfWeek - baseDow + 7) % 7;
      const next = new Date(normalizedBase);
      next.setDate(normalizedBase.getDate() + delta);
      return next;
    };

    if (log.table_name === 'classes') {
      const name = (newObj?.name || oldObj?.name) as unknown;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }

    if (log.table_name === 'class_reservations') {
      const classId = (newObj?.class_id || oldObj?.class_id) as unknown;
      const className = typeof classId === 'string' ? historyClassNameById[classId] : undefined;
      const instructorName = typeof classId === 'string' ? historyClassInstructorById[classId] : undefined;
      const day = typeof classId === 'string' ? historyClassDayOfWeekById[classId] : undefined;

      const reservedAtRaw = (newObj?.reserved_at || oldObj?.reserved_at) as unknown;
      const baseDate =
        typeof reservedAtRaw === 'string'
          ? new Date(reservedAtRaw)
          : log.created_at
            ? new Date(log.created_at)
            : null;

      const dateLabel =
        typeof day === 'number' && baseDate && Number.isFinite(baseDate.getTime())
          ? format(computeNextOccurrenceDate(baseDate, day), 'MMM dd, yyyy')
          : dayName(day);

      const parts = [className, instructorName, dateLabel].filter(Boolean);
      if (parts.length > 0) return parts.join(' • ');
    }

    if (log.table_name === 'attendance') {
      const classId = (newObj?.class_id || oldObj?.class_id) as unknown;
      const studentId = (newObj?.student_id || oldObj?.student_id) as unknown;
      const className = typeof classId === 'string' ? historyClassNameById[classId] : undefined;
      const studentName = typeof studentId === 'string' ? historyProfileNameById[studentId] : undefined;
      const parts = [studentName, className].filter(Boolean);
      if (parts.length > 0) return parts.join(' • ');
    }

    const genericName = (newObj?.name || oldObj?.name || newObj?.title || oldObj?.title) as unknown;
    if (typeof genericName === 'string' && genericName.trim()) return genericName.trim();
    return null;
  };

  const renderHistoryEntityChips = (
    label: string | null,
    tone: 'success' | 'danger',
    partLabels?: string[]
  ) => {
    if (!label) return null;
    const parts = label
      .split('•')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 0) return null;

    // Split parts into 2 rows for better readability
    const firstRowParts = parts.slice(0, 2);
    const secondRowParts = parts.slice(2);

    return (
      <div className="mt-1 text-xs text-gray-700 dark:text-gray-300 space-y-1">
        {/* First row */}
        <div>
          {firstRowParts.map((p, idx) => {
            const prefix = partLabels?.[idx];
            return (
              <span key={`row1-${idx}:${p}`}>
                {idx > 0 ? ' • ' : ''}
                {prefix ? (
                  <span className="font-medium">{prefix}: </span>
                ) : null}
                <span>{p}</span>
              </span>
            );
          })}
        </div>
        {/* Second row (if there are more parts) */}
        {secondRowParts.length > 0 && (
          <div>
            {secondRowParts.map((p, idx) => {
              const prefix = partLabels?.[idx + 2]; // Adjust index for second row
              return (
                <span key={`row2-${idx}:${p}`}>
                  {idx > 0 ? ' • ' : ''}
                  {prefix ? (
                    <span className="font-medium">{prefix}: </span>
                  ) : null}
                  <span>{p}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const hydrateCreateUserAcademies = async () => {
      if (!createUserOpen) return;
      try {
        const { data, error } = await supabase
          .from('academies')
          .select('id, name')
          .order('name', { ascending: true });
        if (error) throw error;
        setCreateUserAcademies(((data || []) as Array<{ id: string; name: string }>).filter((a) => !!a?.id));
      } catch {
        setCreateUserAcademies([]);
      }
    };
    hydrateCreateUserAcademies();
  }, [createUserOpen]);

  const resetCreateUserForm = () => {
    setNewUserEmail('');
    setNewUserFirstName('');
    setNewUserLastName('');
    setNewUserRole('student');
    setNewUserMembershipStatus('inactive');
    setNewUserAcademyId(null);
  };

  const uuidv4 = () => {
    try {
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        return (crypto as any).randomUUID() as string;
      }
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      }
    } catch {
      // ignore
    }
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
    return `${s4()}${s4()}-${s4()}-4${s4().slice(1)}-${((8 + Math.random() * 4) | 0).toString(16)}${s4().slice(1)}-${s4()}${s4()}${s4()}`;
  };

  const handleCreateUser = async () => {
    const email = newUserEmail.trim();
    const firstName = newUserFirstName.trim();
    const lastName = newUserLastName.trim();

    if (!email || !firstName || !lastName) {
      toast({
        title: 'Missing required fields',
        description: 'Email, First name, and Last name are required.',
        variant: 'destructive',
      });
      return;
    }

    setCreateUserSaving(true);
    try {
      const id = uuidv4();

      const payload: ProfilesInsert = {
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: newUserRole,
        membership_status: newUserMembershipStatus,
        academy_id: newUserAcademyId,
      };

      const { error } = await supabase.from('profiles').insert(payload);
      if (error) throw error;

      toast({
        title: 'User created',
        description: `${firstName} ${lastName} has been added.`,
      });

      setCreateUserOpen(false);
      resetCreateUserForm();
      fetchAuditLogs();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Create user failed',
        description: error?.message || 'Failed to create user.',
        variant: 'destructive',
      });
    } finally {
      setCreateUserSaving(false);
    }
  };

  const openDeleteProfileDialog = (profileId: string, label: string) => {
    if (!profileId) return;
    if (profileId === currentUserId) {
      toast({
        title: 'Not allowed',
        description: 'You cannot delete your own profile from here.',
        variant: 'destructive',
      });
      return;
    }
    setConfirmDeleteProfile({ id: profileId, label });
    setConfirmDeleteAlsoLogs(false);
  };

  const confirmDeleteProfileUser = async () => {
    if (!confirmDeleteProfile) return;
    const profileId = confirmDeleteProfile.id;

    setDeletingProfileId(profileId);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', profileId);
      if (error) throw error;

      if (confirmDeleteAlsoLogs) {
        const { error: logsError } = await supabase.from('audit_logs').delete().eq('user_id', profileId);
        if (logsError) throw logsError;

        // Best-effort: delete comprehensive logs too if policies allow.
        try {
          const { error: comprehensiveError } = await supabase
            .from('audit_logs_comprehensive')
            .delete()
            .eq('user_id', profileId);
          if (comprehensiveError) {
            // ignore if not permitted
          }
        } catch {
          // ignore
        }
      }

      toast({
        title: 'Deleted',
        description: 'Profile user deleted.',
      });

      if (selectedGroup?.user_id === profileId) {
        setSelectedGroup(null);
      }

      await fetchAuditLogs();
      await fetchStats();
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Failed to delete profile user.',
        variant: 'destructive',
      });
    } finally {
      setDeletingProfileId(null);
      setConfirmDeleteProfile(null);
      setConfirmDeleteAlsoLogs(false);
    }
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Logs</CardTitle>
            <Database className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalLogs}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">All system events</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Today</CardTitle>
            <CalendarIcon className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.todayLogs}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Recent activity</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Role Changes</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.roleChanges}</div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Permission updates</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Security Events</CardTitle>
            <Shield className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.securityEvents}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Critical alerts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Users</CardTitle>
            <User className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.uniqueUsers}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Unique accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Header and Controls */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900">
        <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Audit Log Viewer</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Monitor system activities and security events
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateUserOpen(true)}
                className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
              >
                <User className="h-4 w-4 mr-2" />
                Create User
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs} className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmDeleteSelected(true)}
                disabled={deleting || selectedIds.size === 0}
                className="bg-red-600 hover:bg-red-700 shadow-md"
              >
                Delete Selected{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white dark:bg-slate-900">
          <Dialog
            open={confirmDeleteSelected}
            onOpenChange={(open) => {
              if (!open) setConfirmDeleteSelected(false);
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Selected Logs</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  This will permanently delete the selected audit log entries.
                </DialogDescription>
              </DialogHeader>

              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">Selected:</span> {selectedIds.size}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteSelected(false)}
                  disabled={deleting}
                >
                  No
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await deleteSelected();
                    setConfirmDeleteSelected(false);
                  }}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? 'Deleting...' : `Yes, Delete (${selectedIds.size})`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog
            open={createUserOpen}
            onOpenChange={(open) => {
              setCreateUserOpen(open);
              if (!open) resetCreateUserForm();
            }}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Create User</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  This will insert a new row into public.profiles.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="name@email.com" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>First name</Label>
                    <Input value={newUserFirstName} onChange={(e) => setNewUserFirstName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last name</Label>
                    <Input value={newUserLastName} onChange={(e) => setNewUserLastName(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">owner</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="staff">staff</SelectItem>
                        <SelectItem value="member">member</SelectItem>
                        <SelectItem value="student">student</SelectItem>
                        <SelectItem value="instructor">instructor</SelectItem>
                        <SelectItem value="visitor">visitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Membership status</Label>
                    <Select value={newUserMembershipStatus} onValueChange={setNewUserMembershipStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Membership" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="inactive">inactive</SelectItem>
                        <SelectItem value="suspended">suspended</SelectItem>
                        <SelectItem value="cancelled">cancelled</SelectItem>
                        <SelectItem value="pending">pending</SelectItem>
                        <SelectItem value="guardian">guardian</SelectItem>
                        <SelectItem value="frozen">frozen</SelectItem>
                        <SelectItem value="alumni">alumni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Academy (optional)</Label>
                  <Select
                    value={newUserAcademyId || 'none'}
                    onValueChange={(v) => setNewUserAcademyId(v === 'none' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {createUserAcademies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateUserOpen(false)} disabled={createUserSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createUserSaving}>
                    {createUserSaving ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!confirmDeleteProfile}
            onOpenChange={(open) => {
              if (!open) {
                setConfirmDeleteProfile(null);
                setConfirmDeleteAlsoLogs(false);
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Profile User</DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400">
                  Choose whether to delete the user only, or user + their logs.
                </DialogDescription>
              </DialogHeader>

              <div className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-medium">User:</span> {confirmDeleteProfile?.label || '—'}
              </div>

              <div className="flex items-center gap-2 rounded-lg border p-3 bg-gray-50 dark:bg-slate-900">
                <Checkbox
                  checked={confirmDeleteAlsoLogs}
                  onCheckedChange={(v) => setConfirmDeleteAlsoLogs(Boolean(v))}
                  aria-label="Also delete audit logs"
                />
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  <div className="font-medium">Also delete audit logs</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Removes audit logs for this user so you don’t see “Unknown User” entries.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteProfile(null)}
                  disabled={!!deletingProfileId}
                >
                  No
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteProfileUser}
                  disabled={!!deletingProfileId}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingProfileId
                    ? 'Deleting...'
                    : confirmDeleteAlsoLogs
                      ? 'Yes, Delete User + Logs'
                      : 'Yes, Delete User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Filters */}
          <div className="flex gap-4 mb-6 flex-wrap p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border">
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
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-slate-800">
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="w-10 font-semibold text-gray-700 dark:text-gray-300">
                    <Checkbox
                      checked={selectAllState}
                      onCheckedChange={toggleSelectAllVisible}
                      aria-label="Select all"
                      className="border-gray-400"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Timestamp</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">User</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Academy</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Role</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((row, index) => {
                  const rowLogIds = row.logs.map((l) => l.id);
                  const rowSelected = rowLogIds.length > 0 && rowLogIds.every((id) => selectedIds.has(id));
                  const sampleLog = row.logs[0];
                  const isOnline = row.user_id && (onlineUserIds.has(row.user_id) || row.user_id === currentUserId);
                  const canDeleteProfile = !!row.user_id && row.user_id !== currentUserId;
                  const deletingThisProfile = !!row.user_id && deletingProfileId === row.user_id;
                  return (
                    <TableRow key={row.key} className={cn(
                      "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors",
                      index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-900/50",
                      isOnline && "border-l-4 border-l-green-400"
                    )}>
                      <TableCell className="py-4">
                        <Checkbox
                          checked={rowSelected}
                          onCheckedChange={() => toggleSelectGroup(rowLogIds)}
                          aria-label={`Select ${row.key}`}
                          className="border-gray-400"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(row.latest_at), 'MMM dd, HH:mm:ss')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(row.latest_at), 'yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <span className="text-gray-900 dark:text-gray-100">{getUserDisplayName(sampleLog)}</span>
                            {row.user_id && row.user_id === currentUserId ? (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                You
                              </Badge>
                            ) : null}
                          </div>
                          {row.profiles?.email && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">{row.profiles.email}</div>
                          )}
                          {row.user_id && isUserOnline(row.user_id) ? (
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                              🟢 Online for {getOnlineDurationLabel(row.user_id) || '0m'}
                            </div>
                          ) : row.user_id ? (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              🔴 Offline{getOfflineDurationLabel(row.user_id) ? ` for ${getOfflineDurationLabel(row.user_id)}` : ''}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {row.profiles?.academy_name || <span className="text-gray-400">—</span>}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className={cn(
                          "text-xs font-medium",
                          row.profiles?.role === 'admin' && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
                          row.profiles?.role === 'student' && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
                          row.profiles?.role === 'member' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        )}>
                          {row.profiles?.role || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedGroup({
                              key: row.key,
                              user_id: row.user_id,
                              logs: row.logs,
                              latest_at: row.latest_at,
                              profiles: row.profiles,
                            })}
                            className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {row.user_id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteProfileDialog(row.user_id as string, getUserDisplayName(sampleLog))}
                              disabled={!canDeleteProfile || deletingThisProfile}
                              className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {groupedRows.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {safePageIndex * pageSize + 1}-{Math.min((safePageIndex + 1) * pageSize, groupedRows.length)} of {groupedRows.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex(0)}
                  disabled={safePageIndex === 0}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={safePageIndex === 0}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePageIndex >= totalPages - 1}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageIndex(totalPages - 1)}
                  disabled={safePageIndex >= totalPages - 1}
                >
                  Last
                </Button>
              </div>
            </div>
          )}

          {groupedRows.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedGroup && (
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
            <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">Activity History</DialogTitle>
                  <DialogDescription className="text-slate-600 dark:text-slate-400">
                    {selectedGroup.user_id ? getUserDisplayName(selectedGroup.logs[0]) : 'System'} • {selectedGroup.logs.length} events
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="flex gap-3 flex-wrap items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border mt-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search history..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {historyDateFilter ? format(historyDateFilter, 'PPP') : 'Filter by date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={historyDateFilter}
                    onSelect={setHistoryDateFilter}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setHistoryDateFilter(undefined)}
                      className="w-full"
                    >
                      Clear Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="destructive"
                onClick={deleteHistorySelected}
                disabled={historyDeleting || historySelectedIds.size === 0}
                className="bg-red-600 hover:bg-red-700 shadow-md"
              >
                Delete{historySelectedIds.size > 0 ? ` (${historySelectedIds.size})` : ''}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-slate-800">
                    <TableRow className="border-b border-gray-200 dark:border-gray-700">
                      <TableHead className="w-10 px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        <Checkbox
                          checked={historySelectAllState}
                          onCheckedChange={toggleSelectAllHistoryVisible}
                          aria-label="Select all history"
                          className="border-gray-400"
                        />
                      </TableHead>
                      <TableHead className="w-[160px] px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Timestamp</TableHead>
                      <TableHead className="w-[220px] px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">User</TableHead>
                      <TableHead className="w-[220px] px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Action</TableHead>
                      <TableHead className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyVisibleRows.map((row, index) => {
                      const rowIds = row.logs.map((l) => l.id);
                      const allRowSelected = rowIds.length > 0 && rowIds.every((id) => historySelectedIds.has(id));
                      const someRowSelected = rowIds.some((id) => historySelectedIds.has(id));
                      const rowSelectState: boolean | 'indeterminate' = allRowSelected
                        ? true
                        : someRowSelected
                          ? 'indeterminate'
                          : false;

                      return (
                        <TableRow key={row.key} className={cn(
                          "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors",
                          index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-900/50"
                        )}>
                          <TableCell className="px-3 py-3 align-top">
                            <Checkbox
                              checked={rowSelectState}
                              onCheckedChange={() => toggleSelectHistoryMany(rowIds)}
                              aria-label={`Select ${row.key}`}
                              className="border-gray-400"
                            />
                          </TableCell>
                          <TableCell className="px-3 py-3 align-top font-mono text-sm whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {format(new Date(row.created_at), 'MMM dd, HH:mm:ss')}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(row.created_at), 'yyyy')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 align-top">
                            <div className="space-y-1">
                              {row.logs.map((l) => (
                                <div key={l.id} className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {getUserDisplayName(l)}
                                  </span>
                                  {l.profiles?.email ? (
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{l.profiles.email}</span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 align-top">
                            <div className="space-y-1">
                              {row.logs.map((l) => (
                                <div key={l.id} className="flex items-center gap-2 flex-wrap">
                                  {getActionBadge(l.action, l.table_name)}
                                  <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                    {l.table_name}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 align-top">
                            <div className="space-y-2">
                              {row.logs.map((l) => (
                                <div key={l.id}>
                                  {(() => {
                                    const normalized = normalizeAction(l.action);

                                    if (normalized === 'update') {
                                      const changes = getFieldChanges(l.old_values, l.new_values);
                                      if (changes.length === 0) return (
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Updated</span>
                                      );
                                      const shown = changes.slice(0, 2);
                                      const more = changes.length - shown.length;
                                      return (
                                        <div className="text-xs">
                                          <div className="text-gray-700 dark:text-gray-300 font-medium mb-1">Updated fields:</div>
                                          <div className="space-y-1">
                                            {shown.map((c) => (
                                              <div key={c.key} className="flex items-center gap-2 text-xs">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{getReadableFieldLabel(c.key)}:</span>
                                                <span className="text-gray-700 dark:text-gray-300">{c.oldStr}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-gray-700 dark:text-gray-300">{c.newStr}</span>
                                              </div>
                                            ))}
                                            {more > 0 ? (
                                              <div className="text-gray-500 dark:text-gray-500 text-xs">+{more} more field(s)</div>
                                            ) : null}
                                          </div>
                                        </div>
                                      );
                                    }

                                    if (normalized === 'create') {
                                      const label = getHistoryEntityLabel(l);
                                      const chipLabels =
                                        l.table_name === 'class_reservations'
                                          ? ['Class', 'Instructor', 'Date']
                                          : l.table_name === 'attendance'
                                            ? ['Student', 'Class']
                                            : l.table_name === 'classes'
                                              ? ['Class']
                                              : undefined;

                                      return (
                                        <div className="text-xs">
                                          <div className="text-gray-700 dark:text-gray-300 font-medium">Created:</div>
                                          {renderHistoryEntityChips(label, 'success', chipLabels) || (
                                            <div className="text-gray-600 dark:text-gray-400 text-xs">Created</div>
                                          )}
                                        </div>
                                      );
                                    }

                                    if (normalized === 'delete') {
                                      const label = getHistoryEntityLabel(l);
                                      const chipLabels =
                                        l.table_name === 'class_reservations'
                                          ? ['Class', 'Instructor', 'Date']
                                          : l.table_name === 'attendance'
                                            ? ['Student', 'Class']
                                            : l.table_name === 'classes'
                                              ? ['Class']
                                              : undefined;

                                      return (
                                        <div className="text-xs">
                                          <div className="text-gray-700 dark:text-gray-300 font-medium">Deleted:</div>
                                          {renderHistoryEntityChips(label, 'danger', chipLabels) || (
                                            <div className="text-gray-600 dark:text-gray-400 text-xs">Deleted</div>
                                          )}
                                        </div>
                                      );
                                    }

                                    if (normalized === 'login') {
                                      return (
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">User logged in</span>
                                      );
                                    }

                                    if (normalized === 'logout') {
                                      return (
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">User logged out</span>
                                      );
                                    }

                                    return (
                                      <span className="text-xs text-gray-700 dark:text-gray-300">{getChangeSummary(l)}</span>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            {historyFilteredLogs.length > 100 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Showing first 100 of {historyFilteredLogs.length} filtered results
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};