import { CommunicationCenter } from '@/components/admin/CommunicationCenter';
import { BackButton } from '@/components/ui/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Communications = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="break-words">Communications</span>
              </h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Only academy owners and administrators can access communications.
              </p>
            </CardContent>
          </Card>
        </div>
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
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Communications</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Send announcements and messages, manage templates, and review delivery history
            </p>
          </div>
        </div>

        <CommunicationCenter />
      </div>
    </div>
  );
};

export default Communications;
