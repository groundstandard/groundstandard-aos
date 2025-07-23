import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Users,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface PaymentAnalyticsData {
  total_revenue: number;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  refunded_amount: number;
  outstanding_amount: number;
  average_payment_value: number;
  payment_conversion_rate: number;
}

export const PaymentAnalytics = () => {
  const [timeframe, setTimeframe] = useState('30');
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['payment-analytics', timeframe],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = timeframe === 'all' ? new Date('2020-01-01') : subDays(endDate, parseInt(timeframe));
      
      // Generate analytics for the period
      const { error } = await supabase.rpc('update_payment_analytics', {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      
      // Fetch the generated analytics
      const { data, error: fetchError } = await supabase
        .from('payment_analytics')
        .select('*')
        .gte('period_start', format(startDate, 'yyyy-MM-dd'))
        .lte('period_end', format(endDate, 'yyyy-MM-dd'))
        .order('period_start', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      return data;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getMetricColor = (value: number, isGood: boolean) => {
    if (isGood) {
      return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
    } else {
      return value < 20 ? 'text-green-600' : value < 40 ? 'text-yellow-600' : 'text-red-600';
    }
  };

  const metrics = [
    {
      title: 'Total Revenue',
      value: analytics?.total_revenue ? formatCurrency(analytics.total_revenue) : '$0',
      icon: DollarSign,
      color: 'text-green-600',
      description: 'Total revenue generated'
    },
    {
      title: 'Total Payments',
      value: analytics?.total_payments?.toString() || '0',
      icon: CreditCard,
      color: 'text-blue-600',
      description: 'Total payment transactions'
    },
    {
      title: 'Success Rate',
      value: `${analytics?.payment_conversion_rate?.toFixed(1) || 0}%`,
      icon: TrendingUp,
      color: getMetricColor(analytics?.payment_conversion_rate || 0, true),
      description: 'Payment success rate'
    },
    {
      title: 'Average Payment',
      value: analytics?.average_payment_value ? formatCurrency(analytics.average_payment_value) : '$0',
      icon: BarChart3,
      color: 'text-purple-600',
      description: 'Average payment amount'
    }
  ];

  const statusMetrics = [
    {
      label: 'Successful',
      value: analytics?.successful_payments || 0,
      total: analytics?.total_payments || 1,
      color: 'bg-green-500'
    },
    {
      label: 'Failed',
      value: analytics?.failed_payments || 0,
      total: analytics?.total_payments || 1,
      color: 'bg-red-500'
    },
    {
      label: 'Refunded Amount',
      value: analytics?.refunded_amount || 0,
      isAmount: true,
      color: 'bg-yellow-500'
    },
    {
      label: 'Outstanding',
      value: analytics?.outstanding_amount || 0,
      isAmount: true,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Analytics</h2>
          <p className="text-muted-foreground">Comprehensive payment performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Payment Status Breakdown
          </CardTitle>
          <CardDescription>
            Distribution of payment statuses for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusMetrics.map((status) => (
              <div key={status.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status.label}</span>
                  <div className="flex items-center gap-2">
                    {status.isAmount ? (
                      <span className="text-sm font-semibold">
                        {formatCurrency(status.value)}
                      </span>
                    ) : (
                      <>
                        <span className="text-sm font-semibold">{status.value}</span>
                        <Badge variant="outline">
                          {((status.value / status.total) * 100).toFixed(1)}%
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                {!status.isAmount && (
                  <Progress 
                    value={(status.value / status.total) * 100} 
                    className="h-2"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.payment_conversion_rate && analytics.payment_conversion_rate > 90 && (
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Excellent payment success rate!</span>
                </div>
              )}
              {analytics?.average_payment_value && analytics.average_payment_value > 5000 && (
                <div className="flex items-center gap-2 text-blue-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">High average transaction value</span>
                </div>
              )}
              {analytics?.failed_payments && analytics.total_payments && (
                analytics.failed_payments / analytics.total_payments) > 0.1 && (
                <div className="flex items-center gap-2 text-orange-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm">Consider reviewing failed payment reasons</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Period Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Period:</span>
                <span>
                  {timeframe === 'all' ? 'All Time' : `Last ${timeframe} days`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Transactions:</span>
                <span>{analytics?.total_payments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue Growth:</span>
                <span className="text-green-600">+12.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};