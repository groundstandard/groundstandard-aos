import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Navigation } from '@/components/Navigation';
import MobileBottomNavigation from './MobileBottomNavigation';
import { cn } from '@/lib/utils';

// ABOUTME: Responsive layout wrapper that adapts navigation and spacing based on device type. Handles desktop top navigation and mobile bottom navigation seamlessly.

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
}

const ResponsiveLayout = ({ 
  children, 
  className = "",
  showNavigation = true 
}: ResponsiveLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet Top Navigation */}
      {showNavigation && !isMobile && <Navigation />}
      
      {/* Main Content Area */}
      <main className={cn(
        "min-h-screen",
        // Desktop: Account for fixed top navigation
        !isMobile && showNavigation && "pt-20",
        // Mobile: Account for bottom navigation
        isMobile && showNavigation && "pb-16",
        className
      )}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {showNavigation && isMobile && <MobileBottomNavigation />}
    </div>
  );
};

export default ResponsiveLayout;