
"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const freeFeatures = [
  "List plants for sale or trade",
  "Engage in community forums",
  "Basic seller dashboard",
  "Manage personal plant wishlist",
];

const proFeatures = [
  "All features from the Free plan",
  "Run sales with coupons & promotions",
  "Automated 'Thank You' & 'New Follower' coupons",
  "Feature your listings for more visibility",
  "Advanced sales analytics",
  "AI-powered pricing insights tool",
  "Priority customer support",
];

function TierCard({ title, description, price, features, isPro = false }: { title: string, description: string, price: string, features: string[], isPro?: boolean }) {
    return (
        <Card className={cn("flex flex-col shadow-lg", isPro && "border-2 border-primary relative overflow-hidden")}>
            {isPro && (
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
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                </p>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            <span className="text-sm">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter>
                 <Button className={cn("w-full text-lg", !isPro && "bg-secondary text-secondary-foreground hover:bg-secondary/90")} disabled={isPro}>
                    {isPro ? "Upgrade to Pro (Coming Soon)" : "Your Current Plan"}
                 </Button>
            </CardFooter>
        </Card>
    );
}

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto py-8">
        <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                Choose Your Plan
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Unlock powerful tools to grow your plant business with Sprout Pro.
            </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <TierCard
                title="Free"
                description="For hobbyists and casual sellers getting started on Sprout."
                price="$0"
                features={freeFeatures}
            />
            <TierCard
                title="Sprout Pro"
                description="For serious sellers looking to boost sales and visibility."
                price="$10"
                features={proFeatures}
                isPro
            />
        </div>
    </div>
  );
}
