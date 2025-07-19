import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceReports } from "@/components/reports/AttendanceReports";
import { StudentReports } from "@/components/reports/StudentReports";
import { ClassReports } from "@/components/reports/ClassReports";
import { RevenueReports } from "@/components/reports/RevenueReports";
import { OverviewReports } from "@/components/reports/OverviewReports";
import { BarChart3, Users, Calendar, DollarSign, TrendingUp } from "lucide-react";

const Reports = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Only allow admin access
  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You need administrator privileges to access reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Academy Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive analytics and insights for your martial arts academy
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-background/50 backdrop-blur">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewReports />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <AttendanceReports />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <StudentReports />
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <ClassReports />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <RevenueReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;