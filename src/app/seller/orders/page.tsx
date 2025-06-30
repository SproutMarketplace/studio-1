
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function OrdersPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <Package className="h-8 w-8" /> Orders
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Your Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This feature is coming soon. You'll be able to track and manage all your plant sales here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
