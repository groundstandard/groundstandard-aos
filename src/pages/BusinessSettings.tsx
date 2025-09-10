import React from 'react';
import { BusinessConfigManagement } from '@/components/admin/BusinessConfigManagement';
import { BackButton } from '@/components/ui/BackButton';
import { Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BusinessSettings = () => {
  const { user, profile } = useAuth();

  // Redirect unauthenticated users
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Restrict access to owners and admins only
  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="break-words">Business Settings</span>
              </h1>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Only academy owners and administrators can access business settings.
              </p>
            </CardContent>
          </Card>
        </div>
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
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Business Settings</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Configure your academy's business rules, pricing, and operational settings
            </p>
          </div>
        </div>
        
        <BusinessConfigManagement />
      </div>
    </div>
  );
};

export default BusinessSettings;