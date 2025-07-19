import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  priceId: string;
  popular?: boolean;
  icon?: React.ReactNode;
}

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  currentPlan?: string;
}

export const SubscriptionCard = ({ plan, currentPlan }: SubscriptionCardProps) => {
  const { createCheckout, subscriptionInfo } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isCurrentPlan = currentPlan === plan.name;
  const isSubscribed = subscriptionInfo?.subscribed;

  const handleSubscribe = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const getIcon = () => {
    if (plan.icon) return plan.icon;
    if (plan.name.toLowerCase().includes('premium')) return <Crown className="h-5 w-5" />;
    if (plan.name.toLowerCase().includes('basic')) return <Star className="h-5 w-5" />;
    return <Check className="h-5 w-5" />;
  };

  return (
    <Card className={`card-minimal relative ${
      plan.popular ? 'ring-2 ring-primary' : ''
    } ${isCurrentPlan ? 'bg-primary/5 border-primary' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {getIcon()}
        </div>
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <span className="text-3xl font-bold text-primary">
            ${plan.price}
          </span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className="w-full"
          onClick={handleSubscribe}
          disabled={loading || isCurrentPlan}
          variant={isCurrentPlan ? "secondary" : "default"}
        >
          {loading ? "Processing..." : 
           isCurrentPlan ? "Current Plan" :
           isSubscribed ? `Upgrade to ${plan.name}` : 
           `Subscribe to ${plan.name}`}
        </Button>
      </CardContent>
    </Card>
  );
};