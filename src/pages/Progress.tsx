import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { BackButton } from '@/components/ui/BackButton';
import { ProgressTracker } from '@/components/student/ProgressTracker';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';

const Progress = () => {
  const { profile, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (profile?.role !== 'student') {
    return (
      <div className="min-h-screen bg-gradient-subtle overflow-x-hidden">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-full">
          <BackButton />
          <Card className="shadow-card border-0 max-w-full">
            <CardContent className={`${isMobile ? 'p-6' : 'p-8'}`}>
              <div className="text-center">
                <AlertTriangle className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} mx-auto mb-4 text-muted-foreground`} />
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-2`}>Student Access Only</h2>
                <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>
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
    <div className="min-h-screen bg-gradient-subtle overflow-x-hidden">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-full">
        <BackButton />
        <div className="flex items-center justify-between">
          <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-foreground truncate`}>
            My Progress
          </h1>
        </div>
        
        <ProgressTracker />
      </div>
    </div>
  );
};

export default Progress;