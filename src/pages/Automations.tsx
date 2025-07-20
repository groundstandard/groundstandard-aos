import { AutomationManagement } from '@/components/admin/AutomationManagement';
import { BackButton } from '@/components/ui/BackButton';
import { Zap } from 'lucide-react';

export default function Automations() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Automations</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Streamline academy operations with intelligent automation workflows
            </p>
          </div>
        </div>
        <AutomationManagement />
      </div>
    </div>
  );
}