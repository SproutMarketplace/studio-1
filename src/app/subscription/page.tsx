
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { updateUserSubscription } from "@/lib/firestoreService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Gem, CheckCircle2, Leaf, Star } from "lucide-react";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export default function SubscriptionPage() {
  const { user, profile, loading: authLoading, refreshUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You need to be logged in to subscribe.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserSubscription(user.uid);
      await refreshUserProfile();
      toast({
        title: "Welcome to Sprout Pro!",
        description: "Your subscription is now active. Enjoy your benefits!",
      });
    } catch (error) {
      console.error("Subscription failed:", error);
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: "There was an error processing your subscription. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  let isPro = false;
  if (profile && profile.subscription && profile.subscription.status === 'pro') {
    const expiry = profile.subscription.expiryDate;
    if (!expiry || (expiry as Timestamp).toDate() > new Date()) {
      isPro = true;
    }
  }
  const expiryDate = profile?.subscription?.expiryDate;

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-secondary p-8 text-primary-foreground">
          <div className="flex items-center gap-4">
            <Gem className="w-12 h-12" />
            <div>
              <CardTitle className="text-4xl font-bold">Sprout Pro</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg">
                Unlock exclusive benefits and save money.
              </CardDescription>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          {isPro && expiryDate ? (
            <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-primary">You are a Pro Member!</h3>
              <p className="text-muted-foreground mt-2">
                Your subscription is active until {format((expiryDate as Timestamp).toDate(), 'MMMM d, yyyy')}.
              </p>
              <p className="text-sm mt-1">Thank you for supporting the Sprout community!</p>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-semibold mb-4">Why Go Pro?</h3>
              <ul className="space-y-3 mb-6 text-muted-foreground">
                <li className="flex items-start">
                  <Leaf className="w-5 h-5 mr-3 mt-1 text-primary shrink-0" />
                  <span><span className="font-semibold text-foreground">Zero Platform Fees:</span> Keep 100% of your sales. No hidden costs, no commission.</span>
                </li>
                <li className="flex items-start">
                  <Star className="w-5 h-5 mr-3 mt-1 text-primary shrink-0" />
                  <span><span className="font-semibold text-foreground">Pro Member Badge:</span> Get a special badge on your profile to stand out in the community.</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-3 mt-1 text-primary shrink-0" />
                  <span><span className="font-semibold text-foreground">More features coming soon!</span> You'll get early access to all new tools and perks.</span>
                </li>
              </ul>

              <Card className="bg-muted/50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-primary">$5.99 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                    <p className="text-xs text-muted-foreground">Billed monthly, cancel anytime.</p>
                  </div>
                  <Button size="lg" onClick={handleSubscribe} disabled={isLoading || !user}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </Button>
                </div>
              </Card>
              {!user && !authLoading && (
                 <p className="text-center text-sm text-destructive mt-4">
                   You must be <Link href="/login" className="underline font-semibold">logged in</Link> to subscribe.
                 </p>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
                This is a simulated subscription for demonstration purposes. No real payment will be processed.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
