
"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { updateUserData } from "@/lib/firestoreService";

const freeFeatures = [
  "List plants for sale or trade",
  "Engage in public community forums",
  "Basic seller dashboard & stats",
  "Manage personal plant wishlist",
];

const proFeatures = [
  "All features from the Free plan",
  "Verified Seller Badge next to your name",
  "Access to Marketing Tools (Coupons & Promotions)",
  "AI-powered pricing insights tool",
  "Advanced analytics & sales insights",
  "Entry to a private, Pro-only community forum",
];

const eliteFeatures = [
    "All features from the Pro plan",
    "Waived platform fees on all sales and buys",
    "Access to exclusive plant collections & sales events",
    "Priority customer support",
    "Early access to new Sprout features",
]

function TierCard({ 
    title, 
    description, 
    price, 
    priceDescription,
    originalPrice,
    discount,
    features, 
    tier, 
    isHighlighted = false, 
    onChoosePlan 
}: { 
    title: string, 
    description: string, 
    price: string, 
    priceDescription: string,
    originalPrice?: string,
    discount?: string,
    features: string[], 
    tier: 'free' | 'pro' | 'elite', 
    isHighlighted?: boolean, 
    onChoosePlan: (tier: 'free' | 'pro' | 'elite') => void 
}) {
    return (
        <Card className={cn("flex flex-col shadow-lg", isHighlighted && "border-2 border-primary relative overflow-hidden")}>
            {isHighlighted && discount && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                    BEST VALUE
                </div>
            )}
            <CardHeader>
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
                <div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold">
                            {price}
                        </p>
                        {originalPrice && (
                            <p className="text-xl font-medium text-muted-foreground line-through">
                                {originalPrice}
                            </p>
                        )}
                    </div>
                    {discount && !isHighlighted && (
                        <Badge variant="destructive" className="mt-1">{discount}</Badge>
                    )}
                    <p className="text-sm font-normal text-muted-foreground">{priceDescription}</p>
                    {tier !== 'free' && (
                        <p className="text-sm font-semibold text-primary mt-1">Includes a 7-day free trial</p>
                    )}
                </div>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                 <Button className={cn("w-full text-lg")} onClick={() => onChoosePlan(tier)}>
                    {tier === 'free' ? "Continue with Free" : `Start 7-Day Free Trial`}
                 </Button>
            </CardFooter>
        </Card>
    );
}

export default function SubscriptionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, updateUserProfileInContext } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handleChoosePlan = async (tier: 'free' | 'pro' | 'elite') => {
        if (user) {
            try {
                await updateUserData(user.uid, { subscriptionTier: tier });
                updateUserProfileInContext({ subscriptionTier: tier }); // Optimistic update
            } catch (error) {
                console.error("Failed to update subscription tier:", error);
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: "Could not save your subscription choice.",
                });
                return;
            }
        }
        
        toast({
            title: `Welcome to the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan!`,
            description: "You are being redirected to the catalog.",
        });
        router.push('/catalog');
    };

  return (
    <div className="container mx-auto py-8">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                Choose Your Plan
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Unlock powerful tools to grow your plant business and enhance your experience.
            </p>
        </header>

        <div className="flex justify-center items-center gap-4 mb-8">
            <Label htmlFor="billing-cycle-switch" className={cn(billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground', 'font-semibold transition-colors')}>Monthly</Label>
            <Switch 
                id="billing-cycle-switch"
                checked={billingCycle === 'yearly'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
             <Label htmlFor="billing-cycle-switch" className={cn(billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground', 'font-semibold transition-colors')}>
                Yearly
                <Badge variant="secondary" className="ml-2 bg-amber-200 text-amber-900 hover:bg-amber-200">Save 15%</Badge>
             </Label>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
            <TierCard
                title="Free"
                description="For hobbyists and casual sellers getting started on Sprout."
                price="$0"
                priceDescription="No cost, ever."
                features={freeFeatures}
                tier="free"
                onChoosePlan={handleChoosePlan}
            />
            <TierCard
                title="Sprout Pro"
                description="For serious sellers looking to boost sales and visibility."
                price={billingCycle === 'monthly' ? "$10" : "$8.50"}
                priceDescription={billingCycle === 'monthly' ? "/month" : "/month, billed yearly"}
                features={proFeatures}
                tier="pro"
                onChoosePlan={handleChoosePlan}
            />
             <TierCard
                title="Sprout Elite"
                description="For top sellers and plant businesses who want every advantage."
                price={billingCycle === 'monthly' ? "$14.99" : "$12.50"}
                originalPrice={billingCycle === 'monthly' ? "$19.99" : undefined}
                discount={billingCycle === 'monthly' ? "25% OFF" : undefined}
                priceDescription={billingCycle === 'monthly' ? "/month" : "/month, billed yearly"}
                features={eliteFeatures}
                tier="elite"
                isHighlighted={billingCycle === 'yearly'}
                onChoosePlan={handleChoosePlan}
            />
        </div>
    </div>
  );
}
