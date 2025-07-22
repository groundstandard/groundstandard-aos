import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Users } from "lucide-react";
import heroImage from "@/assets/hero-dojo.jpg";

interface HeroProps {
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
}

const Hero = ({ onLoginClick, onSignUpClick }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Modern Martial Arts Dojo" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/90" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-card/50 backdrop-blur-sm border border-border rounded-full px-4 py-2 mb-8">
            <Shield className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium">Complete Academy Management Platform</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Empower Your
            <span className="block gradient-gold bg-clip-text text-transparent">
              Martial Arts Academy
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline payments, track attendance, manage students, and sync with HighLevel. 
            The all-in-one platform designed specifically for martial arts academies.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Academies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {onLoginClick && (
              <Button 
                variant="default" 
                size="xl" 
                className="group"
                onClick={onLoginClick}
              >
                Sign In
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
            <Button 
              variant="gold" 
              size="xl" 
              className="group"
              onClick={() => window.location.href = '/academy-setup'}
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" className="group">
              <Play className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-col items-center">
            <p className="text-sm text-muted-foreground mb-4">Trusted by leading martial arts academies</p>
            <div className="flex items-center space-x-8 opacity-60">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6" />
                <span className="font-semibold">HighLevel Certified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6" />
                <span className="font-semibold">Stripe Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;