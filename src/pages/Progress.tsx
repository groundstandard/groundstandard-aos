import { useAuth } from '@/hooks/useAuth';
import { ProgressTracker } from '@/components/student/ProgressTracker';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

const Progress = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (profile?.role !== 'student') {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto p-6">
          <Card className="shadow-card border-0">
            <CardContent className="p-8">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Student Access Only</h2>
                <p className="text-muted-foreground">
                  Progress tracking is available for students only.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">My Progress</h1>
        </div>

        <ProgressTracker />
      </div>
    </div>
  );
};

export default Progress;