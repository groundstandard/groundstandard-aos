import { useAuth } from "@/hooks/useAuth";
import { AttendanceTracker } from "@/components/attendance/AttendanceTracker";
import { Navigate } from "react-router-dom";

const Attendance = () => {
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Attendance</h1>
        </div>
        
        <AttendanceTracker />
      </div>
    </div>
  );
};

export default Attendance;