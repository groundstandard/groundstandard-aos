import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Download, Filter } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

type DateRange = {
  from: Date;
  to: Date;
};

export const AttendanceReports = () => {
  const isMobile = useIsMobile();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-reports', dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return null;

      // Get attendance records with student and class info
      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles!attendance_student_id_fkey(first_name, last_name, belt_level),
          classes(name, instructor_id)
        `)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      // Get attendance statistics
      const totalSessions = attendance?.length || 0;
      const presentSessions = attendance?.filter(a => a.status === 'present').length || 0;
      const lateSessions = attendance?.filter(a => a.status === 'late').length || 0;
      const absentSessions = attendance?.filter(a => a.status === 'absent').length || 0;

      // Get student attendance rates
      const studentStats: Record<string, any> = {};
      attendance?.forEach(record => {
        const studentId = record.student_id;
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            name: `${record.profiles?.first_name} ${record.profiles?.last_name}`,
            belt_level: record.profiles?.belt_level,
            total: 0,
            present: 0,
            late: 0,
            absent: 0
          };
        }
        studentStats[studentId].total++;
        studentStats[studentId][record.status]++;
      });

      return {
        attendance: attendance || [],
        stats: {
          totalSessions,
          presentSessions,
          lateSessions,
          absentSessions,
          attendanceRate: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0
        },
        studentStats: Object.values(studentStats)
      };
    }
  });

  const presetRanges: { label: string; range: DateRange }[] = [
    {
      label: "Last 7 days",
      range: { from: subDays(new Date(), 7), to: new Date() }
    },
    {
      label: "Last 30 days", 
      range: { from: subDays(new Date(), 30), to: new Date() }
    },
    {
      label: "This Month",
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Date Range Selector */}
      <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className={`flex ${isMobile ? 'flex-col space-y-4' : 'items-center justify-between'}`}>
            <span className={isMobile ? 'text-base' : ''}>Attendance Analytics</span>
            <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`${isMobile ? 'w-full text-xs' : 'w-auto'} justify-start text-left font-normal`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateRange.from && dateRange.to ? (
                        `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                      ) : (
                        "Pick a date range"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className={`${isMobile ? 'w-80' : 'w-auto'} p-0`} align="end">
                  <div className={`${isMobile ? 'flex-col' : 'flex'}`}>
                    <div className={`flex ${isMobile ? 'flex-row flex-wrap' : 'flex-col'} gap-2 p-3 ${!isMobile && 'border-r'}`}>
                      {presetRanges.map((preset, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className={`justify-start ${isMobile ? 'text-xs px-2 py-1' : 'text-sm'}`}
                          onClick={() => setDateRange(preset.range)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        if (range?.from && range?.to) {
                          setDateRange({ from: range.from, to: range.to });
                        }
                      }}
                      numberOfMonths={isMobile ? 1 : 2}
                      className="pointer-events-auto"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              {!isMobile && (
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription className={isMobile ? 'text-sm' : ''}>
            Detailed attendance tracking and analysis for the selected period
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{attendanceData?.stats.totalSessions || 0}</div>
          </CardContent>
        </Card>

        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>{attendanceData?.stats.presentSessions || 0}</div>
          </CardContent>
        </Card>

        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-yellow-600`}>{attendanceData?.stats.lateSessions || 0}</div>
          </CardContent>
        </Card>

        <Card className="max-w-full overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium truncate`}>Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{attendanceData?.stats.attendanceRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Attendance Summary */}
      <Card className="max-w-full overflow-hidden">
        <CardHeader>
          <CardTitle className={isMobile ? 'text-base' : ''}>Student Attendance Summary</CardTitle>
          <CardDescription className={isMobile ? 'text-sm' : ''}>
            Individual attendance rates for all students in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[700px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Student</TableHead>
                  <TableHead className="w-[100px]">Belt Level</TableHead>
                  <TableHead className="w-[80px]">Total</TableHead>
                  <TableHead className="w-[80px]">Present</TableHead>
                  <TableHead className="w-[80px]">Late</TableHead>
                  <TableHead className="w-[80px]">Absent</TableHead>
                  <TableHead className="w-[80px]">Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData?.studentStats.map((student: any, index: number) => {
                  const rate = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium truncate">{student.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{student.belt_level || 'No Belt'}</Badge>
                      </TableCell>
                      <TableCell>{student.total}</TableCell>
                      <TableCell className="text-green-600">{student.present}</TableCell>
                      <TableCell className="text-yellow-600">{student.late}</TableCell>
                      <TableCell className="text-red-600">{student.absent}</TableCell>
                      <TableCell>
                        <Badge variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"} className="text-xs">
                          {rate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!attendanceData?.studentStats || attendanceData.studentStats.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No attendance data found for the selected period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};