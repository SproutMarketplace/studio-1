
import { MessageCircle, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MessagesPage() {
  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader>
          <div className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
            <MessageCircle className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold">Direct Messaging</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Connect with buyers and sellers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-lg border-border bg-muted/30">
            <Construction className="w-16 h-16 mb-4 text-muted-foreground" />
            <p className="text-xl font-semibold text-foreground">Feature Coming Soon!</p>
            <p className="text-muted-foreground">
              We're working hard to bring you a seamless messaging experience.
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <Link href="/catalog">Back to Catalog</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
