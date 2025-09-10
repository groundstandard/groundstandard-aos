import { BusinessConfigManagement } from '@/components/admin/BusinessConfigManagement';
import { BackButton } from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BusinessConfigPage() {
  const { loading } = useAuth();
  const { effectiveRole } = useEffectiveRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only allow admins and owners to access business configuration
  if (effectiveRole !== 'admin' && effectiveRole !== 'owner') {
    return (
      <div className="container mx-auto p-6">
        <BackButton />
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access restricted. Only academy administrators and owners can manage business configurations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <BackButton />
      <div className="mt-6">
        <BusinessConfigManagement />
      </div>
    </div>
  );
}