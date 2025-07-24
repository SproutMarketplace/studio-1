
"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

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

function TierCard({ title, description, price, features, tier, isHighlighted = false, onChoosePlan }: { title: string, description: string, price: string, features: string[], tier: 'free' | 'pro' | 'elite', isHighlighted?: boolean, onChoosePlan: (tier: string) => void }) {
    return (
        <Card className={cn("flex flex-col shadow-lg", isHighlighted && "border-2 border-primary relative overflow-hidden")}>
            {isHighlighted && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    BEST VALUE
                </div>
            )}
            <CardHeader>
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
                <p className="text-4xl font-bold">
                    {price}
                    {tier !== 'free' && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                </p>
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
                 <Button className={cn("w-full text-lg")} onClick={() => onChoosePlan(title)}>
                    {tier === 'free' ? "Continue with Free" : `Choose ${title}`}
                 </Button>
            </CardFooter>
        </Card>
    );
}

export default function SubscriptionPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleChoosePlan = (planName: string) => {
        // In a real app, this would initiate the Stripe checkout flow for paid plans.
        // For now, we'll just show a toast and redirect.
        toast({
            title: `Welcome to the ${planName} plan!`,
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
            <TierCard
                title="Free"
                description="For hobbyists and casual sellers getting started on Sprout."
                price="$0"
                features={freeFeatures}
                tier="free"
                onChoosePlan={handleChoosePlan}
            />
            <TierCard
                title="Sprout Pro"
                description="For serious sellers looking to boost sales and visibility."
                price="$10"
                features={proFeatures}
                tier="pro"
                onChoosePlan={handleChoosePlan}
            />
             <TierCard
                title="Sprout Elite"
                description="For top sellers and plant businesses who want every advantage."
                price="$19.99"
                features={eliteFeatures}
                tier="elite"
                isHighlighted
                onChoosePlan={handleChoosePlan}
            />
        </div>
    </div>
  );
}
