import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  MapPin, 
  Users, 
  BarChart3, 
  Smartphone, 
  Settings,
  Shield,
  Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: "Payment Processing",
      description: "Stripe integration with flexible processing fees (0%, 0.5%, 1%). Handle single and recurring payments seamlessly.",
      highlight: "Stripe Certified"
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Smart Attendance",
      description: "Mobile check-in within 1 mile of facility. Students register for classes and track attendance automatically.",
      highlight: "GPS Enabled"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Family Management",
      description: "Hierarchical user profiles supporting youth students under parent accounts while maintaining individual profiles.",
      highlight: "Family Friendly"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Reporting",
      description: "Comprehensive analytics for students, alumni, payments, and attendance. Track your academy's performance.",
      highlight: "Real-time Data"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile Apps",
      description: "Dedicated apps for students and administrators. Manage everything on the go with native mobile experiences.",
      highlight: "iOS & Android"
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "HighLevel Integration",
      description: "Seamlessly sync contacts and member status. Leverage HighLevel's features while maintaining data consistency.",
      highlight: "Auto Sync"
    }
  ];

  return (
    <section id="features" className="py-20 bg-card/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card/50 backdrop-blur-sm border border-border rounded-full px-4 py-2 mb-6">
            <Zap className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything Your Academy
            <span className="block gradient-gold bg-clip-text text-transparent">
              Needs to Thrive
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From payment processing to attendance tracking, we've built the complete toolkit 
            for modern martial arts academy management.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="gradient-card border-border/50 shadow-card hover:shadow-gold transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-secondary group-hover:text-gold-accent transition-colors">
                    {feature.icon}
                  </div>
                  <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded-full">
                    {feature.highlight}
                  </span>
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <Button variant="gold" size="lg">
            <Shield className="h-5 w-5 mr-2" />
            Explore All Features
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;