import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, CreditCard, Calendar, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const RevenueReports = () => {
  // Mock data for demonstration - in a real app, this would come from your payment processor
  const mockRevenueData = {
    monthlyRevenue: 12500,
    previousMonthRevenue: 11200,
    totalStudents: 85,
    averageRevenuePerStudent: 147,
    outstandingPayments: 2400,
    membershipBreakdown: {
      monthly: { count: 65, revenue: 9750 },
      quarterly: { count: 15, revenue: 2250 },
      annual: { count: 5, revenue: 500 }
    },
    paymentMethods: {
      card: 78,
      bank: 12,
      cash: 10
    }
  };

  const growthRate = mockRevenueData.previousMonthRevenue > 0 
    ? Math.round(((mockRevenueData.monthlyRevenue - mockRevenueData.previousMonthRevenue) / mockRevenueData.previousMonthRevenue) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Integration Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Revenue reports require integration with your payment processor (Stripe, Square, etc.). 
          Current data is for demonstration purposes only.
        </AlertDescription>
      </Alert>

      {/* Revenue Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockRevenueData.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {growthRate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 rotate-180" />
              )}
              {Math.abs(growthRate)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Revenue per Student</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockRevenueData.averageRevenuePerStudent}</div>
            <p className="text-xs text-muted-foreground">Monthly average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${mockRevenueData.outstandingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Overdue invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Memberships</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockRevenueData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Paying members</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakdown">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="trends">Payment Trends</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-6">
          {/* Membership Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Membership Revenue Breakdown</span>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </CardTitle>
              <CardDescription>
                Revenue distribution by membership type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(mockRevenueData.membershipBreakdown).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{type} Memberships</div>
                      <div className="text-sm text-muted-foreground">{data.count} active members</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${data.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        ${Math.round(data.revenue / data.count)}/member
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
              <CardDescription>
                How students prefer to pay their memberships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(mockRevenueData.paymentMethods).map(([method, count]) => (
                  <div key={method} className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{count}%</div>
                    <div className="text-sm text-muted-foreground capitalize">{method} Payments</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Trends Analysis</CardTitle>
              <CardDescription>
                Historical payment patterns and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-medium mb-2">Average Collection Time</div>
                    <div className="text-2xl font-bold">3.2 days</div>
                    <div className="text-sm text-muted-foreground">From invoice to payment</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-medium mb-2">Payment Success Rate</div>
                    <div className="text-2xl font-bold text-green-600">94.2%</div>
                    <div className="text-sm text-muted-foreground">First attempt success</div>
                  </div>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Insight:</strong> Credit card payments have a 97% success rate compared to 89% for bank transfers. 
                    Consider offering incentives for card payments to improve cash flow.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting</CardTitle>
              <CardDescription>
                Projected revenue based on current trends and enrollment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Next Month</div>
                    <div className="text-2xl font-bold">${(mockRevenueData.monthlyRevenue * 1.05).toLocaleString()}</div>
                    <Badge variant="default" className="mt-1">+5% projected</Badge>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Next Quarter</div>
                    <div className="text-2xl font-bold">${(mockRevenueData.monthlyRevenue * 3.2).toLocaleString()}</div>
                    <Badge variant="secondary" className="mt-1">Conservative</Badge>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Annual Projection</div>
                    <div className="text-2xl font-bold">${(mockRevenueData.monthlyRevenue * 12.8).toLocaleString()}</div>
                    <Badge variant="outline" className="mt-1">With growth</Badge>
                  </div>
                </div>

                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Revenue Opportunity:</strong> With current attendance rates, adding 2 more evening classes 
                    could increase monthly revenue by an estimated $2,800-$3,500.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};