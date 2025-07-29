import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { Shield, Menu, TrendingUp, Users, DollarSign, CheckCircle, BarChart3, Activity, User } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import MultiAcademySwitcher from "@/components/academy/MultiAcademySwitcher";
import { ViewToggle } from "@/components/ui/ViewToggle";

const Navigation = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = user ? [] : [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#about", label: "About" }
  ];

  const MobileMenu = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <div className="flex flex-col space-y-4 mt-8">
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href} 
              className="text-foreground hover:text-primary transition-smooth py-2 px-4 rounded-lg hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t pt-4 space-y-2">
            {user ? (
              <Button 
                variant="default" 
                size="sm"
                className="w-full"
                onClick={() => {
                  navigate('/dashboard');
                  setIsOpen(false);
                }}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigate('/auth');
                    setIsOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigate('/auth');
                    setIsOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} text-primary`} />
                <span className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>DojoMaster</span>
              </div>
              {user && <ViewToggle />}
            </div>
            
            {!isMobile && (
              <div className="hidden md:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <a 
                    key={link.href}
                    href={link.href} 
                    className="text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {user ? (
                <>
                  {!isMobile && (
                    <>
                      <MultiAcademySwitcher />
                    </>
                  )}
                  {isMobile && <MobileMenu />}
                </>
              ) : (
                <>
                  {!isMobile ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/auth')}
                      >
                        Sign In
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate('/auth')}
                      >
                        Get Started
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate('/auth')}
                      >
                        Sign In
                      </Button>
                      <MobileMenu />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* macOS-style Glass Dock at Bottom - Global Navigation */}
      {user && !isMobile && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-1 p-2 bg-background/20 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-105"
              onClick={() => navigate('/dashboard')}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-medium">Overview</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-105"
              onClick={() => navigate('/contacts')}
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Contacts</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-105"
              onClick={() => navigate('/payments')}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs font-medium">Payments</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-105"
              onClick={() => navigate('/attendance')}
            >
              <CheckCircle className="h-5 w-5" />
              <span className="text-xs font-medium">Attendance</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-105"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-medium">Reporting</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-105"
              onClick={() => navigate('/automations')}
            >
              <Activity className="h-5 w-5" />
              <span className="text-xs font-medium">Automations</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-105"
              onClick={() => navigate('/profile')}
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Profile</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export { Navigation };