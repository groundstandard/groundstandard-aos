import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$99",
      period: "per month",
      description: "Perfect for small academies getting started",
      processingFee: "1%",
      features: [
        "Up to 100 students",
        "Basic attendance tracking",
        "Payment processing",
        "Student profiles",
        "Basic reporting",
        "Mobile app access",
        "Email support"
      ],
      highlighted: false,
      icon: <Zap className="h-6 w-6" />
    },
    {
      name: "Professional",
      price: "$199",
      period: "per month",
      description: "Most popular for growing academies",
      processingFee: "0.5%",
      features: [
        "Up to 500 students",
        "Advanced attendance tracking",
        "Family management",
        "HighLevel integration",
        "Advanced reporting & analytics",
        "Mobile apps (student & admin)",
        "Priority support",
        "Custom branding"
      ],
      highlighted: true,
      icon: <Star className="h-6 w-6" />
    },
    {
      name: "Enterprise",
      price: "$399",
      period: "per month",
      description: "For large academies and multi-location chains",
      processingFee: "0%",
      features: [
        "Unlimited students",
        "Multi-location support",
        "Advanced family hierarchies",
        "Custom HighLevel workflows",
        "White-label solutions",
        "API access",
        "Dedicated account manager",
        "24/7 phone support"
      ],
      highlighted: false,
      icon: <Crown className="h-6 w-6" />
    }
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-card/50 backdrop-blur-sm border border-border rounded-full px-4 py-2 mb-6">
            <Star className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium">Simple Pricing</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your
            <span className="block gradient-gold bg-clip-text text-transparent">
              Academy Plan
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transparent pricing with no hidden fees. Pay based on your academy size with 
            flexible processing fee options.
          </p>
          
          <div className="inline-flex items-center bg-card border border-border rounded-lg p-1">
            <button className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium">
              Monthly
            </button>
            <button className="px-4 py-2 rounded-md text-muted-foreground font-medium">
              Annual (Save 20%)
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${
                plan.highlighted 
                  ? 'gradient-card border-secondary shadow-gold scale-105' 
                  : 'gradient-card border-border/50 shadow-card'
              } transition-all duration-300 hover:shadow-gold`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-secondary text-secondary-foreground font-semibold px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.highlighted ? 'bg-secondary/20 text-secondary' : 'bg-muted/20 text-muted-foreground'
                  }`}>
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">{plan.period}</span>
                </div>
                <CardDescription className="text-base mb-4">
                  {plan.description}
                </CardDescription>
                <div className="flex justify-center">
                  <Badge variant="outline" className="text-xs">
                    {plan.processingFee} processing fee
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.highlighted ? "gold" : "outline"} 
                  className="w-full"
                  size="lg"
                >
                  {plan.highlighted ? "Start Free Trial" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            All plans include a 30-day free trial. No credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span>✓ Cancel anytime</span>
            <span>✓ No setup fees</span>
            <span>✓ 99.9% uptime SLA</span>
            <span>✓ SOC 2 compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;