import { useAuth } from "@/hooks/useAuth";
import { useView } from "@/hooks/useView";
import { BackButton } from "@/components/ui/BackButton";
import { ClassSchedule } from "@/components/classes/ClassSchedule";
import { ClassManagement } from "@/components/admin/ClassManagement";

const Classes = () => {
  const { profile, loading } = useAuth();
  const { currentView } = useView();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin' && currentView === 'admin';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        <BackButton />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin ? 'Class Management' : 'Class Schedule'}
          </h1>
        </div>

        {isAdmin ? (
          <div className="space-y-6">
            <ClassManagement />
            <div className="border-t pt-6">
              <h2 className="text-2xl font-semibold mb-4">Student View</h2>
              <ClassSchedule />
            </div>
          </div>
        ) : (
          <ClassSchedule />
        )}
      </div>
    </div>
  );
};

export default Classes;