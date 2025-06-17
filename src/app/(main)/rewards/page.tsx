
import { Award, Star, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RewardsPage() {
  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 text-accent">
            <Award className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold">Rewards Program</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Earn points and get recognized!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg border-border bg-muted/30">
            <Construction className="w-16 h-16 mb-4 text-muted-foreground" />
            <p className="text-xl font-semibold text-foreground">Feature Coming Soon!</p>
            <p className="text-muted-foreground">
              Our exciting rewards program is currently under development. Stay tuned!
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-lg bg-muted/50">
              <Star className="w-6 h-6 mb-2 text-yellow-500 fill-yellow-400" />
              <h3 className="font-semibold">Points for Listings</h3>
              <p className="text-xs text-muted-foreground">Earn for every plant you share.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <Star className="w-6 h-6 mb-2 text-yellow-500 fill-yellow-400" />
              <h3 className="font-semibold">Badges for Trades</h3>
              <p className="text-xs text-muted-foreground">Get recognized for successful trades.</p>
            </div>
          </div>
           <Button asChild size="lg" className="w-full">
            <Link href="/catalog">Explore Plants</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
