
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function StatsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <BarChart3 className="h-8 w-8" /> Statistics
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Sales & Listing Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This feature is coming soon. Dive deep into performance data for your listings.</p>
                </CardContent>
            </Card>
        </div>
    )
}
