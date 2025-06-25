import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award } from "lucide-react";

export default function RewardsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Award className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">Rewards & Badges</CardTitle>
          <CardDescription className="text-lg">This feature is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Earn points and unlock badges for being an active member of the Sprout community!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
