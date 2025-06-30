
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export default function MarketingPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <Megaphone className="h-8 w-8" /> Marketing
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Promote Your Listings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This feature is coming soon. Access tools to help your plants get noticed by more buyers.</p>
                </CardContent>
            </Card>
        </div>
    )
}
