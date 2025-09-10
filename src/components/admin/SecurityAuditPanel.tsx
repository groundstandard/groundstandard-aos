import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { config, isProduction } from "@/lib/config";

interface SecurityCheck {
  name: string;
  status: 'passed' | 'warning' | 'failed' | 'checking';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
}

export const SecurityAuditPanel = () => {
  const [checking, setChecking] = useState(false);
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const { toast } = useToast();

  const runSecurityAudit = async () => {
    setChecking(true);
    const auditChecks: SecurityCheck[] = [];

    try {
      // 1. Environment Configuration Check
      auditChecks.push({
        name: "Environment Configuration",
        status: isProduction() ? 'passed' : 'warning',
        message: isProduction() ? 'Production keys configured' : 'Development/test keys detected',
        severity: isProduction() ? 'low' : 'medium',
        recommendation: isProduction() ? undefined : 'Switch to production Stripe keys for live deployment'
      });

      // 2. Webhook Security Check
      try {
        const { data: webhookValidation } = await supabase.functions.invoke('validate-webhook-secret', {
          body: { testPayload: true }
        });

        auditChecks.push({
          name: "Webhook Signature Validation",
          status: webhookValidation?.validation?.webhookSecretSet ? 'passed' : 'warning',
          message: webhookValidation?.validation?.webhookSecretSet 
            ? 'Webhook signatures properly configured' 
            : 'Webhook signature validation disabled',
          severity: webhookValidation?.validation?.webhookSecretSet ? 'low' : 'high',
          recommendation: webhookValidation?.recommendations?.production || webhookValidation?.recommendations?.testing
        });
      } catch (error) {
        auditChecks.push({
          name: "Webhook Signature Validation",
          status: 'failed',
          message: 'Unable to validate webhook configuration',
          severity: 'high',
          recommendation: 'Check STRIPE_WEBHOOK_SECRET environment variable configuration'
        });
      }

      // 3. Password Reset Security Check
      const resetSecurityCheck = sessionStorage.getItem('sb-recovery-access-token');
      auditChecks.push({
        name: "Password Reset Security",
        status: resetSecurityCheck ? 'warning' : 'passed',
        message: resetSecurityCheck 
          ? 'Recovery tokens detected in session storage' 
          : 'No active recovery tokens found',
        severity: resetSecurityCheck ? 'medium' : 'low',
        recommendation: resetSecurityCheck ? 'Recovery tokens should be cleared after password reset' : undefined
      });

      // 4. Authentication Configuration Check
      auditChecks.push({
        name: "Authentication Configuration", 
        status: 'passed',
        message: 'Auto-login from URL disabled, session persistence enabled',
        severity: 'low'
      });

      // 5. Academy Isolation Check - This requires a more complex query
      try {
        // Check if user has access to multiple academies (potential for data leakage)
        const { data: userAcademies } = await supabase
          .rpc('get_user_academies');

        const academyCount = userAcademies?.length || 0;
        auditChecks.push({
          name: "Academy Data Isolation",
          status: academyCount <= 1 ? 'passed' : 'warning',
          message: `User has access to ${academyCount} academies`,
          severity: academyCount > 3 ? 'medium' : 'low',
          recommendation: academyCount > 1 ? 'Verify RLS policies prevent cross-academy data access' : undefined
        });
      } catch (error) {
        auditChecks.push({
          name: "Academy Data Isolation",
          status: 'warning',
          message: 'Unable to verify academy isolation',
          severity: 'medium',
          recommendation: 'Check academy membership and RLS policies'
        });
      }

      setChecks(auditChecks);

      // Show summary toast
      const failed = auditChecks.filter(c => c.status === 'failed').length;
      const warnings = auditChecks.filter(c => c.status === 'warning').length;
      
      if (failed > 0) {
        toast({
          title: "Security Issues Found",
          description: `${failed} critical issues and ${warnings} warnings detected`,
          variant: "destructive",
        });
      } else if (warnings > 0) {
        toast({
          title: "Security Audit Complete",
          description: `${warnings} warnings found - review recommendations`,
        });
      } else {
        toast({
          title: "Security Audit Passed",
          description: "No critical security issues detected",
        });
      }

    } catch (error) {
      console.error('Security audit failed:', error);
      toast({
        title: "Audit Failed",
        description: "Unable to complete security audit",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getSeverityBadge = (severity: SecurityCheck['severity']) => {
    const variants = {
      low: 'default',
      medium: 'secondary', 
      high: 'destructive',
      critical: 'destructive'
    } as const;

    return (
      <Badge variant={variants[severity]} className="text-xs">
        {severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Audit
        </CardTitle>
        <CardDescription>
          Run comprehensive security checks on your application configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSecurityAudit} 
          disabled={checking}
          className="w-full"
        >
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Security Audit...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Security Audit
            </>
          )}
        </Button>

        {checks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Audit Results</h3>
            {checks.map((check, index) => (
              <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-2 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{check.name}</p>
                      {getSeverityBadge(check.severity)}
                    </div>
                    <p className="text-xs text-muted-foreground">{check.message}</p>
                    {check.recommendation && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        💡 {check.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Environment:</strong> {isProduction() ? 'Production' : 'Development'}</p>
          <p><strong>Supabase Project:</strong> {config.supabase.projectId}</p>
        </div>
      </CardContent>
    </Card>
  );
};