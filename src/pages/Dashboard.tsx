import { useAuth } from "@/hooks/useAuth";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import { useIsMobile } from "@/hooks/use-mobile";
import { ViewToggle } from "@/components/ui/ViewToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as SelectComponents from "@/components/ui/select";

const Select = SelectComponents.Select;
const SelectContent = SelectComponents.SelectContent;
const SelectItem = SelectComponents.SelectItem;
const SelectTrigger = SelectComponents.SelectTrigger;
const SelectValue = SelectComponents.SelectValue;

import { 
  LogOut, User, Calendar, CreditCard, BarChart3, CheckCircle, MessageCircle, 
  FileText, Award, DollarSign, Users, TrendingUp, Settings, Crown, Star,
  Clock, Target, Activity, Bell, CalendarDays, UserCheck, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ProfileView } from "@/components/profile/ProfileView";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useEffectiveRole();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  if (!user || !profile) {
    return <div>Loading...</div>;
  }

  // Show Admin Dashboard for admin users
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <p>Admin content removed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header with reorganized layout */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate('/chat')}
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Profile Management</DialogTitle>
                </DialogHeader>
                <ProfileView />
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {!isMobile && "Sign Out"}
            </Button>
          </div>
        </div>

        {/* Student Dashboard Content */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {profile.first_name}!</CardTitle>
              <CardDescription>
                Here's your martial arts journey overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Current Belt Level</h3>
                  <Badge variant="outline" className="text-lg p-2">
                    {profile.belt_level || "White Belt"}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Membership Status</h3>
                  <Badge 
                    variant={profile.membership_status === 'active' ? 'default' : 'secondary'}
                    className="text-lg p-2"
                  >
                    {profile.membership_status || "Active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No upcoming classes scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Track your martial arts progress here</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* View Toggle at bottom center */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <ViewToggle />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;