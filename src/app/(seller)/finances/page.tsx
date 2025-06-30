
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CircleDollarSign } from "lucide-react";

export default function FinancesPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <CircleDollarSign className="h-8 w-8" /> Finances
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Track Your Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This feature is coming soon. You'll be able to see your revenue and manage payouts here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
