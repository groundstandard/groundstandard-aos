import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  MessageCircle,
  User,
  CheckCircle,
  Clock,
  Settings,
  Award,
  FileText,
  Activity,
  MoreHorizontal
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// ABOUTME: Mobile-first bottom navigation component that provides touch-friendly navigation for all main app sections. Features swipe gestures, vibration feedback, and role-based menu items.

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  roles?: string[];
}

const MobileBottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin, isOwner, effectiveRole } = useEffectiveRole();
  const [activeTab, setActiveTab] = useState('');
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // Define navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const commonItems: NavItem[] = [
      { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
      { id: 'classes', label: 'Classes', icon: Calendar, path: '/classes' },
      { id: 'checkin', label: 'Check In', icon: Clock, path: '/checkin' },
      { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
    ];

    const adminItems: NavItem[] = [
      { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
      { id: 'contacts', label: 'Contacts', icon: Users, path: '/contacts' },
      { id: 'payments', label: 'Payments', icon: CreditCard, path: '/payments' },
      { id: 'attendance', label: 'Attendance', icon: CheckCircle, path: '/attendance' },
      { id: 'more', label: 'More', icon: MoreHorizontal, path: '#more' }
    ];

    const instructorItems: NavItem[] = [
      { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
      { id: 'classes', label: 'Classes', icon: Calendar, path: '/classes' },
      { id: 'attendance', label: 'Attendance', icon: CheckCircle, path: '/attendance' },
      { id: 'students', label: 'Students', icon: Users, path: '/contacts' },
      { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
    ];

    if (isAdmin || isOwner) {
      return adminItems;
    } else if (effectiveRole === 'instructor') {
      return instructorItems;
    } else {
      return commonItems;
    }
  };

  const navItems = getNavItems();

  // Update active tab based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    const activeItem = navItems.find(item => 
      currentPath === item.path || 
      (item.path !== '/dashboard' && currentPath.startsWith(item.path))
    );
    setActiveTab(activeItem?.id || 'dashboard');
  }, [location.pathname, navItems]);

  // Handle tab navigation with haptic feedback
  const handleTabPress = (item: NavItem) => {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Handle special "More" button
    if (item.id === 'more') {
      setMoreSheetOpen(true);
      return;
    }
    
    setActiveTab(item.id);
    navigate(item.path);
  };

  // Handle more menu item selection
  const handleMoreItemPress = (path: string) => {
    setMoreSheetOpen(false);
    navigate(path);
  };

  // Don't show on auth pages or when user is not logged in
  if (!user || location.pathname === '/auth' || location.pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleTabPress(item)}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] touch-manipulation",
                  "hover:scale-105 active:scale-95",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation'
                }}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive && "scale-110"
                    )} 
                  />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium mt-1 transition-all duration-200",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* More Menu Sheet */}
      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-lg">
          <SheetHeader className="pb-4">
            <SheetTitle>More Options</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2">
            <Button
              variant="ghost"
              className="justify-start h-12"
              onClick={() => handleMoreItemPress('/reports')}
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Reporting
            </Button>
            <Button
              variant="ghost"
              className="justify-start h-12"
              onClick={() => handleMoreItemPress('/automations')}
            >
              <Activity className="h-5 w-5 mr-3" />
              Automations
            </Button>
            <Button
              variant="ghost"
              className="justify-start h-12"
              onClick={() => handleMoreItemPress('/profile')}
            >
              <User className="h-5 w-5 mr-3" />
              Profile
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom padding to prevent content from being hidden behind navigation */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
};

export default MobileBottomNavigation;