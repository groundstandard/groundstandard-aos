import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentMethodManager } from '@/components/payments/PaymentMethodManager';
import { 
  DollarSign,
  CreditCard,
  TrendingUp,
  BarChart3,
  Clock,
  Bell,
  RotateCcw,
  FileText,
  Eye,
  RefreshCw,
  Calendar as CalendarIcon,
  LinkIcon
} from 'lucide-react';
import { RefundManagement } from '@/components/payments/RefundManagement';
import { PaymentAnalytics } from '@/components/payments/PaymentAnalytics';
import { PaymentProcessing } from '@/components/payments/PaymentProcessing';
import { TaxManagement } from '@/components/payments/TaxManagement';
import { cn } from '@/lib/utils';
import { PaymentLogContent } from '@/components/payments/PaymentLogContent';
import { CreatePaymentLinkDialog } from '@/components/payments/CreatePaymentLinkDialog';
import { SetupRecurringDialog } from '@/components/payments/SetupRecurringDialog';
import { SendReminderDialog } from '@/components/payments/SendReminderDialog';
import { CalculateLateFeeDialog } from '@/components/payments/CalculateLateFeeDialog';

interface ComprehensivePaymentManagementProps {
  navigate?: (path: string) => void;
}

export const ComprehensivePaymentManagement = ({ navigate }: ComprehensivePaymentManagementProps) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showLateFeeDialog, setShowLateFeeDialog] = useState(false);
  const [showTaxDialog, setShowTaxDialog] = useState(false);
  
  const tabOptions = [
    { value: "overview", label: "Overview", icon: TrendingUp },
    { value: "processing", label: "Processing", icon: CreditCard },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "schedules", label: "Schedules", icon: Clock },
    { value: "reminders", label: "Reminders", icon: Bell },
    { value: "refunds", label: "Refunds", icon: RotateCcw },
    { value: "reports", label: "Reports", icon: FileText },
    { value: "log", label: "Log", icon: Eye }
  ];


  const getCurrentTabLabel = () => {
    const currentTab = tabOptions.find(option => option.value === activeTab);
    return currentTab ? currentTab.label : "Overview";
  };

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Access denied. Admin privileges required.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className={cn(
        "grid gap-2",
        isMobile ? "grid-cols-2" : "grid-cols-6"
      )}>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowPaymentLinkDialog(true)}
        >
          <CardContent className={cn("p-2", isMobile && "p-1.5")}>
            <div className={cn(
              "flex items-center mb-1",
              isMobile ? "flex-col gap-1 text-center" : "gap-2"
            )}>
              <LinkIcon className={cn(
                "text-blue-600",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <h3 className={cn(
                "font-semibold",
                isMobile ? "text-xs leading-tight" : "text-sm"
              )}>
                {isMobile ? "Payment Link" : "Create Payment Link"}
              </h3>
            </div>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">Generate payment links for contacts</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowRecurringDialog(true)}
        >
          <CardContent className={cn("p-2", isMobile && "p-1.5")}>
            <div className={cn(
              "flex items-center mb-1",
              isMobile ? "flex-col gap-1 text-center" : "gap-2"
            )}>
              <Clock className={cn(
                "text-green-600",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <h3 className={cn(
                "font-semibold",
                isMobile ? "text-xs leading-tight" : "text-sm"
              )}>
                {isMobile ? "Recurring" : "Setup Recurring"}
              </h3>
            </div>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">Create payment schedules</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowReminderDialog(true)}
        >
          <CardContent className={cn("p-2", isMobile && "p-1.5")}>
            <div className={cn(
              "flex items-center mb-1",
              isMobile ? "flex-col gap-1 text-center" : "gap-2"
            )}>
              <Bell className={cn(
                "text-orange-600",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <h3 className={cn(
                "font-semibold",
                isMobile ? "text-xs leading-tight" : "text-sm"
              )}>
                {isMobile ? "Reminder" : "Send Reminder"}
              </h3>
            </div>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">Send payment reminders</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowLateFeeDialog(true)}
        >
          <CardContent className={cn("p-2", isMobile && "p-1.5")}>
            <div className={cn(
              "flex items-center mb-1",
              isMobile ? "flex-col gap-1 text-center" : "gap-2"
            )}>
              <CalendarIcon className={cn(
                "text-red-600",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <h3 className={cn(
                "font-semibold",
                isMobile ? "text-xs leading-tight" : "text-sm"
              )}>
                {isMobile ? "Late Fees" : "Calculate Late Fees"}
              </h3>
            </div>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">Process overdue payments</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveTab('refunds')}
        >
          <CardContent className={cn("p-2", isMobile && "p-1.5")}>
            <div className={cn(
              "flex items-center mb-1",
              isMobile ? "flex-col gap-1 text-center" : "gap-2"
            )}>
              <RotateCcw className={cn(
                "text-green-600",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <h3 className={cn(
                "font-semibold",
                isMobile ? "text-xs leading-tight" : "text-sm"
              )}>
                {isMobile ? "Refunds" : "Refunds & Credits"}
              </h3>
            </div>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">Process refunds and manage credits</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowTaxDialog(true)}
        >
          <CardContent className={cn("p-2", isMobile && "p-1.5")}>
            <div className={cn(
              "flex items-center mb-1",
              isMobile ? "flex-col gap-1 text-center" : "gap-2"
            )}>
              <FileText className={cn(
                "text-purple-600",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <h3 className={cn(
                "font-semibold",
                isMobile ? "text-xs leading-tight" : "text-sm"
              )}>
                {isMobile ? "Tax" : "Tax Management"}
              </h3>
            </div>
            {!isMobile && (
              <p className="text-xs text-muted-foreground">Configure tax rates and compliance</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Navigation */}
      {isMobile ? (
        <div className="mb-6">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full h-12 bg-background/90 backdrop-blur border-border/50">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentOption = tabOptions.find(option => option.value === activeTab);
                    const IconComponent = currentOption?.icon || TrendingUp;
                    return (
                      <>
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span className="font-medium">{getCurrentTabLabel()}</span>
                      </>
                    );
                  })()}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full bg-background/95 backdrop-blur border-border/50">
              {tabOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-primary" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ) : (
        /* Desktop Navigation - keeping simple for now */
        <div className="flex gap-2 mb-6">
          {tabOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.value}
                variant={activeTab === option.value ? "default" : "outline"}
                onClick={() => setActiveTab(option.value)}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                {option.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Content Area */}
      <div className="space-y-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">$0</div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-muted-foreground">Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "processing" && <PaymentProcessing />}
        {activeTab === "analytics" && <PaymentAnalytics />}
        {activeTab === "refunds" && <RefundManagement />}
        
        {activeTab === "schedules" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Schedules</CardTitle>
              <CardDescription>Manage recurring payment schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No payment schedules configured
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "reminders" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Reminders</CardTitle>
              <CardDescription>Track sent and pending payment reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No payment reminders sent
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "reports" && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Generate and download financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-1" />
                    <div>Revenue Report</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "log" && <PaymentLogContent />}
      </div>

      {/* Dialogs */}
      <CreatePaymentLinkDialog 
        open={showPaymentLinkDialog} 
        onOpenChange={setShowPaymentLinkDialog} 
      />
      <SetupRecurringDialog 
        open={showRecurringDialog} 
        onOpenChange={setShowRecurringDialog} 
      />
      <SendReminderDialog 
        open={showReminderDialog} 
        onOpenChange={setShowReminderDialog} 
      />
      <CalculateLateFeeDialog 
        open={showLateFeeDialog} 
        onOpenChange={setShowLateFeeDialog} 
      />
      {showTaxDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tax Management</h2>
              <Button variant="ghost" onClick={() => setShowTaxDialog(false)}>
                ×
              </Button>
            </div>
            <div className="p-4">
              <TaxManagement />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};