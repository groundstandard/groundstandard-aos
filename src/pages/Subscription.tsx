import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { BackButton } from "@/components/ui/BackButton";
import { SubscriptionCard } from "@/components/subscription/SubscriptionCard";
import { SubscriptionStatus } from "@/components/subscription/SubscriptionStatus";
import { Crown, Star, Zap } from "lucide-react";

const Subscription = () => {
  const { user } = useAuth();
  const { subscriptionInfo } = useSubscription();

  if (!user) {
    return <div>Please log in to access subscriptions.</div>;
  }

  const subscriptionPlans = [
    {
      id: "basic-monthly",
      name: "Basic Monthly",
      description: "Essential features for individual practitioners",
      price: 9,
      interval: "month",
      priceId: "price_basic_monthly", // This should match your Stripe price ID
      icon: <Star className="h-5 w-5" />,
      features: [
        "Access to basic training videos",
        "Class schedule viewing",
        "Progress tracking",
        "Community forum access",
        "Mobile app access"
      ]
    },
    {
      id: "premium-monthly",
      name: "Premium Monthly",
      description: "Advanced features for serious martial artists",
      price: 19,
      interval: "month",
      priceId: "price_premium_monthly", // This should match your Stripe price ID
      popular: true,
      icon: <Crown className="h-5 w-5" />,
      features: [
        "Everything in Basic",
        "Advanced training programs",
        "1-on-1 instructor sessions",
        "Video technique analysis",
        "Custom training plans",
        "Priority customer support",
        "Exclusive workshops access"
      ]
    },
    {
      id: "basic-annual",
      name: "Basic Annual",
      description: "Essential features with annual savings",
      price: 90,
      interval: "year",
      priceId: "price_basic_annual", // This should match your Stripe price ID
      icon: <Star className="h-5 w-5" />,
      features: [
        "Everything in Basic Monthly",
        "2 months free",
        "Annual progress reports",
        "Bonus training materials"
      ]
    },
    {
      id: "premium-annual",
      name: "Premium Annual",
      description: "Advanced features with maximum savings",
      price: 190,
      interval: "year",
      priceId: "price_premium_annual", // This should match your Stripe price ID
      icon: <Zap className="h-5 w-5" />,
      features: [
        "Everything in Premium Monthly",
        "2 months free",
        "Annual technique assessment",
        "Exclusive annual tournament entry",
        "Premium gear discount",
        "Master class recordings access"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="flex items-start gap-2 sm:gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="break-words">Membership Plans</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Choose the perfect plan for your martial arts journey
            </p>
          </div>
        </div>

        <div className="grid gap-6 mb-8">
          <SubscriptionStatus />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {subscriptionPlans.map((plan) => (
            <SubscriptionCard
              key={plan.id}
              plan={plan}
              currentPlan={subscriptionInfo?.subscription_tier}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">
            Need help choosing?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our Basic plan is perfect for beginners and casual practitioners. 
            Premium offers advanced features for dedicated martial artists looking 
            to accelerate their growth. Annual plans offer significant savings for 
            long-term commitment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;