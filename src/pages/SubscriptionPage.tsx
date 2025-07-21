import React from 'react';
import { SubscriptionManagement } from '@/components/subscription/SubscriptionManagement';
import { BackButton } from '@/components/ui/BackButton';
import { Crown } from 'lucide-react';

const SubscriptionPage = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Subscription Management</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage your academy's subscription and billing
            </p>
          </div>
        </div>
        <SubscriptionManagement />
      </div>
    </div>
  );
};

export default SubscriptionPage;