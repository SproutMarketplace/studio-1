
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserPlantListings, getOrdersForSeller } from "@/lib/firestoreService";
import type { OrderItem } from "@/models";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CircleDollarSign, Package, BarChart3, Loader2 } from "lucide-react";

export default function SellerDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        revenue: 0,
        sales: 0,
        activeListings: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            const fetchStats = async () => {
                setIsLoading(true);
                try {
                    const [userPlants, sellerOrders] = await Promise.all([
                        getUserPlantListings(user.uid),
                        getOrdersForSeller(user.uid)
                    ]);
                    
                    const activeListings = userPlants.filter(p => p.isAvailable).length;
                    
                    const itemsSoldBySeller = sellerOrders.flatMap(order => 
                        order.items.filter(item => item.sellerId === user.uid)
                    );
                    
                    const sales = itemsSoldBySeller.reduce((acc, item) => acc + item.quantity, 0);
                    const revenue = itemsSoldBySeller.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                    setStats({ revenue, sales, activeListings });
                } catch (error) {
                    console.error("Failed to fetch seller stats:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchStats();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, authLoading]);

    const StatCard = ({ title, value, icon: Icon, isCurrency = false, loading }: { title: string, value: number, icon: React.ElementType, isCurrency?: boolean, loading: boolean}) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                    <div className="text-2xl font-bold">
                        {isCurrency ? `$${value.toFixed(2)}` : value}
                    </div>
                )}
                 {!loading && isCurrency && <p className="text-xs text-muted-foreground">Based on completed sales</p>}
            </CardContent>
        </Card>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6">Dashboard</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Welcome to your Seller Dashboard!</CardTitle>
                    <CardDescription>
                        This is your central hub for managing your plant listings. Stats below are calculated from your current listings and completed orders.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Total Revenue" 
                    value={stats.revenue}
                    icon={CircleDollarSign}
                    isCurrency
                    loading={isLoading}
                />
                <StatCard 
                    title="Total Sales" 
                    value={stats.sales}
                    icon={Package}
                    loading={isLoading}
                />
                <StatCard 
                    title="Active Listings" 
                    value={stats.activeListings}
                    icon={BarChart3}
                    loading={isLoading}
                />
            </div>
        </div>
    )
}
