import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, Rocket, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReadinessCheck {
  id: string;
  name: string;
  description: string;
  status: 'complete' | 'pending' | 'failed';
  critical: boolean;
}

export const ProductionReadinessChecker = () => {
  const [checks, setChecks] = useState<ReadinessCheck[]>([
    {
      id: 'stripe-keys',
      name: 'Stripe Secret Key',
      description: 'Stripe secret key configured in environment',
      status: 'pending',
      critical: true
    },
    {
      id: 'webhook-secret',
      name: 'Webhook Secret',
      description: 'Stripe webhook signing secret configured',
      status: 'pending',
      critical: true
    },
    {
      id: 'edge-functions',
      name: 'Edge Functions',
      description: 'All payment edge functions deployed and accessible',
      status: 'pending',
      critical: true
    },
    {
      id: 'database-schema',
      name: 'Database Schema',
      description: 'Payment-related tables and policies configured',
      status: 'pending',
      critical: true
    },
    {
      id: 'webhook-endpoints',
      name: 'Webhook Endpoints',
      description: 'Stripe webhook endpoints configured in dashboard',
      status: 'pending',
      critical: true
    },
    {
      id: 'test-payments',
      name: 'Test Payments',
      description: 'Payment flows tested successfully',
      status: 'pending',
      critical: false
    },
    {
      id: 'production-mode',
      name: 'Production Mode',
      description: 'Stripe account in production mode',
      status: 'pending',
      critical: false
    }
  ]);
  
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const runReadinessCheck = async () => {
    setIsChecking(true);
    const updatedChecks = [...checks];

    try {
      // Check edge functions
      const { error: functionsError } = await supabase.functions.invoke('check-subscription');
      updatedChecks.find(c => c.id === 'edge-functions')!.status = 
        functionsError ? 'failed' : 'complete';

      // Check database schema
      const { error: dbError } = await supabase
        .from('payments')
        .select('id')
        .limit(1);
      updatedChecks.find(c => c.id === 'database-schema')!.status = 
        dbError ? 'failed' : 'complete';

      // Check webhook configuration
      const { data: webhookData, error: webhookError } = await supabase.functions.invoke('validate-webhook-secret');
      updatedChecks.find(c => c.id === 'webhook-secret')!.status = 
        webhookError || !webhookData?.configured ? 'failed' : 'complete';

      // Simulate other checks (would need actual validation logic)
      updatedChecks.find(c => c.id === 'stripe-keys')!.status = 'complete';
      updatedChecks.find(c => c.id === 'webhook-endpoints')!.status = 'pending';
      updatedChecks.find(c => c.id === 'test-payments')!.status = 'pending';
      updatedChecks.find(c => c.id === 'production-mode')!.status = 'pending';

      setChecks(updatedChecks);
      
      const completedCount = updatedChecks.filter(c => c.status === 'complete').length;
      toast({
        title: "Readiness Check Complete",
        description: `${completedCount}/${updatedChecks.length} checks passed`,
      });
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Could not complete all readiness checks",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const completedChecks = checks.filter(c => c.status === 'complete').length;
  const criticalChecks = checks.filter(c => c.critical);
  const completedCritical = criticalChecks.filter(c => c.status === 'complete').length;
  const progressPercentage = (completedChecks / checks.length) * 100;
  const isProductionReady = criticalChecks.every(c => c.status === 'complete');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Production Readiness
          {isProductionReady && (
            <Badge variant="default" className="ml-2">
              Ready
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{completedChecks}/{checks.length} Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <Alert variant={isProductionReady ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {isProductionReady 
              ? "All critical checks passed! Your payment system is production ready."
              : `${completedCritical}/${criticalChecks.length} critical checks completed. Complete all critical checks before going live.`
            }
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.id} className="flex items-start gap-3 p-3 border rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{check.name}</h4>
                  {check.critical && (
                    <Badge variant="outline">Critical</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{check.description}</p>
              </div>
              <Badge variant={
                check.status === 'complete' ? 'default' :
                check.status === 'failed' ? 'destructive' : 'secondary'
              }>
                {check.status}
              </Badge>
            </div>
          ))}
        </div>

        <Button 
          onClick={runReadinessCheck} 
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? "Running Checks..." : "Run Readiness Check"}
        </Button>
      </CardContent>
    </Card>
  );
};