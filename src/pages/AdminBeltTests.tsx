import { BackButton } from "@/components/ui/BackButton";
import { BeltTestManagement } from "@/components/admin/BeltTestManagement";
import { useAuth } from "@/hooks/useAuth";

const AdminBeltTests = () => {
  const { profile } = useAuth();

  const isStudent = profile?.role === 'student';

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground break-words">
              {isStudent ? 'Belt Promotions' : 'Belt Test Management'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {isStudent
                ? 'View your belt test history and promotion status'
                : 'Schedule and evaluate student belt tests'}
            </p>
          </div>
        </div>

        <BeltTestManagement />
      </div>
    </div>
  );
};

export default AdminBeltTests;
