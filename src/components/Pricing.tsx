import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Pricing = () => {
  const { user } = useAuth();
  const { createCheckout, subscriptionInfo } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans = [
    {
      name: "Basic Monthly",
      price: "$9",
      period: "per month",
      description: "Essential features for individual practitioners",
      priceId: "price_basic_monthly",
      features: [
        "Access to basic training videos",
        "Class schedule viewing",
        "Progress tracking",
        "Community forum access",
        "Mobile app access"
      ],
      highlighted: false,
      icon: <Star className="h-6 w-6" />
    },
    {
      name: "Premium Monthly",
      price: "$19",
      period: "per month",
      description: "Advanced features for serious martial artists",
      priceId: "price_premium_monthly",
      features: [
        "Everything in Basic",
        "Advanced training programs",
        "1-on-1 instructor sessions",
        "Video technique analysis",
        "Custom training plans",
        "Priority customer support",
        "Exclusive workshops access"
      ],
      highlighted: true,
      icon: <Crown className="h-6 w-6" />
    },
    {
      name: "Basic Annual",
      price: "$90",
      period: "per year",
      description: "Essential features with annual savings",
      priceId: "price_basic_annual",
      features: [
        "Everything in Basic Monthly",
        "2 months free",
        "Annual progress reports",
        "Bonus training materials"
      ],
      highlighted: false,
      icon: <Star className="h-6 w-6" />
    },
    {
      name: "Premium Annual",
      price: "$190",
      period: "per year",
      description: "Advanced features with maximum savings",
      priceId: "price_premium_annual",
      features: [
        "Everything in Premium Monthly",
        "2 months free",
        "Annual technique assessment",
        "Exclusive annual tournament entry",
        "Premium gear discount",
        "Master class recordings access"
      ],
      highlighted: false,
      icon: <Zap className="h-6 w-6" />
    }
  ];

  const handleGetStarted = async (plan: any) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!plan.priceId) {
      toast({
        title: "Coming Soon",
        description: "This plan will be available soon!",
      });
      return;
    }

    try {
      setLoadingPlan(plan.name);
      const url = await createCheckout(plan.priceId);
      
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const isCurrentPlan = (planName: string) => {
    return subscriptionInfo?.subscription_tier === planName;
  };

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
                  {isCurrentPlan(plan.name) && (
                    <Badge className="ml-2 bg-primary">Current</Badge>
                  )}
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
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
                  variant={plan.highlighted ? "default" : "outline"} 
                  className="w-full"
                  size="lg"
                  onClick={() => handleGetStarted(plan)}
                  disabled={loadingPlan === plan.name || isCurrentPlan(plan.name)}
                >
                  {loadingPlan === plan.name ? "Processing..." :
                   isCurrentPlan(plan.name) ? "Current Plan" :
                   user ? "Subscribe Now" : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Start your martial arts journey today. Cancel anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span>✓ Cancel anytime</span>
            <span>✓ Secure payments via Stripe</span>
            <span>✓ Instant access</span>
            <span>✓ Expert support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;