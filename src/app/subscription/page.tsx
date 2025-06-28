
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gem } from "lucide-react";

export default function SubscriptionPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Gem className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">Sprout Pro</CardTitle>
          <CardDescription className="text-lg">This feature is coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We're working on exclusive benefits for Pro members. Check back later for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
