import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceReports } from "@/components/reports/AttendanceReports";
import { StudentReports } from "@/components/reports/StudentReports";
import { ClassReports } from "@/components/reports/ClassReports";
import { RevenueReports } from "@/components/reports/RevenueReports";
import { OverviewReports } from "@/components/reports/OverviewReports";
import { AdvancedReports } from "@/components/reports/AdvancedReports";
import { BarChart3, Users, Calendar, DollarSign, TrendingUp } from "lucide-react";

const Reports = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");

  const reportOptions = [
    { value: "overview", label: "Overview", icon: TrendingUp },
    { value: "advanced", label: "Advanced", icon: BarChart3 },
    { value: "attendance", label: "Attendance", icon: Calendar },
    { value: "students", label: "Students", icon: Users },
    { value: "classes", label: "Classes", icon: BarChart3 },
    { value: "revenue", label: "Revenue", icon: DollarSign }
  ];

  const getCurrentReportLabel = () => {
    const currentReport = reportOptions.find(option => option.value === activeTab);
    return currentReport ? currentReport.label : "Overview";
  };

  // Only allow admin and owner access
  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-foreground flex items-center gap-2 flex-wrap`}>
              <BarChart3 className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-primary`} />
              <span className="break-words">Academy Reports</span>
            </h1>
            {!isMobile && (
              <p className="text-muted-foreground mt-1">
                Comprehensive analytics and insights for your martial arts academy
              </p>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobile ? (
          <div className="mb-6">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-12 bg-background/90 backdrop-blur border-border/50">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const currentOption = reportOptions.find(option => option.value === activeTab);
                      const IconComponent = currentOption?.icon || TrendingUp;
                      return (
                        <>
                          <IconComponent className="h-4 w-4 text-primary" />
                          <span className="font-medium">{getCurrentReportLabel()}</span>
                        </>
                      );
                    })()}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-full bg-background/95 backdrop-blur border-border/50">
                {reportOptions.map((option) => {
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
          /* Desktop Navigation */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-background/50 backdrop-blur">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Advanced
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
          </Tabs>
        )}

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === "overview" && <OverviewReports />}
          {activeTab === "advanced" && <AdvancedReports />}
          {activeTab === "attendance" && <AttendanceReports />}
          {activeTab === "students" && <StudentReports />}
          {activeTab === "classes" && <ClassReports />}
          {activeTab === "revenue" && <RevenueReports />}
        </div>
      </div>
    </div>
  );
};

export default Reports;