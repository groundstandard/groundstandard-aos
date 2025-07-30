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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <BackButton />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
              <span className="break-words">Attendance Management</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm lg:text-base leading-relaxed">
              Track and manage student attendance for all classes and sessions
            </p>
          </div>
        </div>

        {/* Attendance Navigation Ribbon */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 border-b border-border pb-3 sm:pb-4 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 hover:text-primary whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => navigate('/membership-management')}
          >
            <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Memberships</span>
            <span className="sm:hidden">Members</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 hover:text-primary whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => navigate('/class-management')}
          >
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Classes
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 hover:text-primary whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => navigate('/events')}
          >
            <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Events
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 hover:text-primary whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => navigate('/belt-testing')}
          >
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Promotions</span>
            <span className="sm:hidden">Belts</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 hover:text-primary whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
            onClick={() => navigate('/checkin')}
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Check-In
          </Button>
          {isAdmin && (
            <Button 
              variant="default" 
              size="sm"
              className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3"
              onClick={() => {
                // Trigger the mark attendance dialog from the AttendanceManagement component
                const markButton = document.querySelector('[data-testid="mark-attendance-trigger"]') as HTMLButtonElement;
                markButton?.click();
              }}
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Mark Attendance</span>
              <span className="sm:hidden">Mark</span>
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