import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full pt-12">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <MessageCircle className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">Your Messages</CardTitle>
          <CardDescription className="text-lg">This feature is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Private and group messaging to coordinate trades and chat with friends is coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
