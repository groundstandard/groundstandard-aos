import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { StudentAttendanceHistory } from "@/components/attendance/StudentAttendanceHistory";
import { Navigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

// ABOUTME: Dedicated page for students to view their attendance history without admin features

const StudentAttendanceHistoryPage = () => {
  const { user, loading } = useAuth();

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
              <span className="break-words">My Attendance History</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              View your class attendance records and statistics
            </p>
          </div>
        </div>
        
        <StudentAttendanceHistory />
      </div>
    </div>
  );
};

export default StudentAttendanceHistoryPage;