import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { Shield, Menu } from "lucide-react";
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
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                    >
                      Dashboard
                    </Button>
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
  );
};

export { Navigation };