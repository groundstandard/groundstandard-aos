import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { BackButton } from "@/components/ui/BackButton";
import { ClassSchedule } from "@/components/classes/ClassSchedule";
import { ClassManagement } from "@/components/admin/ClassManagement";
import { LocationCheckIn } from "@/components/checkin/LocationCheckIn";
import { CalendarClassView } from "@/components/classes/CalendarClassView";


const Classes = () => {
  const { loading } = useAuth();
  const { isAdmin } = useEffectiveRole();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin ? 'Class Management' : 'Class Schedule'}
          </h1>
        </div>

        {isAdmin ? (
          <div className="space-y-6">
            <ClassManagement />
            <div className="border-t pt-6">
              <h2 className="text-2xl font-semibold mb-4">Student View</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <ClassSchedule />
                <LocationCheckIn />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Location-based Check-in at the top */}
            <LocationCheckIn />
            
            {/* Calendar takes up full width */}
            <CalendarClassView />
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;