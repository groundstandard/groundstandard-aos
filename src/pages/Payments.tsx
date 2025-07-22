import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import { ComprehensivePaymentManagement } from "@/components/admin/ComprehensivePaymentManagement";
import { PaymentPortal } from "@/components/payments/PaymentPortal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, useNavigate } from "react-router-dom";
import { CreditCard, DollarSign, Crown } from "lucide-react";
const Payments = () => {
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

  // Show customer portal for students, admin management for admins
  const showAdminView = isAdmin;

  if (!showAdminView) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="break-words">Payment Portal</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Manage your subscription and payment information
              </p>
            </div>
          </div>
          <PaymentPortal userId={user?.id} />
        </div>
      </div>
    );
  }

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need administrator privileges to manage payments.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Payment Management</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Comprehensive payment processing and financial tracking for your academy
            </p>
          </div>
        </div>

        {/* Payments Navigation Ribbon */}
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-6 overflow-x-auto">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 hover:text-primary whitespace-nowrap"
            onClick={() => navigate('/membership-management')}
          >
            <Crown className="h-4 w-4" />
            Memberships
          </Button>
        </div>

        <ComprehensivePaymentManagement />
      </div>
    </div>
  );
};

export default Payments;