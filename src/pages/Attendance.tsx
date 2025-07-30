import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import { AttendanceTracker } from "@/components/attendance/AttendanceTracker";
import { AttendanceManagement } from "@/components/admin/AttendanceManagement";
import { QuickAttendanceDashboard } from "@/components/attendance/QuickAttendanceDashboard";
import { StudentAttendanceHistory } from "@/components/attendance/StudentAttendanceHistory";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, CalendarDays, Star, Clock, Crown, Plus } from "lucide-react";
const Attendance = () => {
  const { user, loading, profile } = useAuth();
  const { isAdmin } = useEffectiveRole();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Attendance Management</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Track and manage student attendance for all classes and sessions
            </p>
          </div>
        </div>

        {/* Attendance Navigation Ribbon */}
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-6 overflow-x-auto">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:text-primary whitespace-nowrap"
            onClick={() => navigate('/membership-management')}
          >
            <Crown className="h-4 w-4" />
            Memberships
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:text-primary whitespace-nowrap"
            onClick={() => navigate('/class-management')}
          >
            <Calendar className="h-4 w-4" />
            Classes
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:text-primary whitespace-nowrap"
            onClick={() => navigate('/events')}
          >
            <CalendarDays className="h-4 w-4" />
            Events
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:text-primary whitespace-nowrap"
            onClick={() => navigate('/belt-testing')}
          >
            <Star className="h-4 w-4" />
            Promotions
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:text-primary whitespace-nowrap"
            onClick={() => navigate('/checkin')}
          >
            <Clock className="h-4 w-4" />
            Check-In
          </Button>
          {isAdmin && (
            <Button 
              variant="default" 
              className="flex items-center gap-2 whitespace-nowrap"
              onClick={() => {
                // Trigger the mark attendance dialog from the AttendanceManagement component
                const markButton = document.querySelector('[data-testid="mark-attendance-trigger"]') as HTMLButtonElement;
                markButton?.click();
              }}
            >
              <Plus className="h-4 w-4" />
              Mark Attendance
            </Button>
          )}
        </div>
        
        {isAdmin ? (
          <AttendanceManagement />
        ) : profile?.role === 'instructor' ? (
          <QuickAttendanceDashboard />
        ) : profile?.role === 'student' ? (
          <StudentAttendanceHistory />
        ) : (
          <AttendanceTracker />
        )}
      </div>
    </div>
  );
};

export default Attendance;