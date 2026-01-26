import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";

const AuditLogs = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center text-muted-foreground">
            Access Restricted
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <span className="break-words">Audit Logs</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Review audit logs for system activities and security events
            </p>
          </div>
        </div>

        <AuditLogViewer />
      </div>
    </div>
  );
};

export default AuditLogs;
