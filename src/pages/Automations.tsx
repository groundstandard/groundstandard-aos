import { AutomationManagement } from '@/components/admin/AutomationManagement';
import { BackButton } from '@/components/ui/BackButton';

export default function Automations() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <BackButton />
        <AutomationManagement />
      </div>
    </div>
  );
}