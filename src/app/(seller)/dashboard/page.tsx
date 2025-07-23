
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserPlantListings, getOrdersForSeller } from "@/lib/firestoreService";
import type { OrderItem, User } from "@/models";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CircleDollarSign, Package, BarChart3, Loader2, Trophy } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Mock data for the challenge leaderboard
const mockLeaderboard: Partial<User>[] = [
    { username: "PlantWizard", avatarUrl: "https://placehold.co/40x40.png" },
    { username: "GreenThumb", avatarUrl: "https://placehold.co/40x40.png" },
    { username: "CactusJack", avatarUrl: "https://placehold.co/40x40.png" },
];

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
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Welcome to your Seller Dashboard!</CardTitle>
                        <CardDescription>
                            This is your central hub for managing your plant listings. Use the navigation on the left to access detailed tools for orders, marketing, and more.
                        </CardDescription>
                    </CardHeader>
                </Card>
                 <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-300">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                             <Trophy className="h-6 w-6 text-amber-600" />
                            <div>
                                <CardTitle className="text-amber-900">Monthly Seller Challenge</CardTitle>
                                <CardDescription className="text-amber-800/80">Challenge: Most Plants Sold!</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-amber-900/90 mb-3">Top seller this month wins <span className="font-bold">500 Reward Points!</span></p>
                         <div className="space-y-2">
                            {mockLeaderboard.map((seller, index) => (
                                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-amber-100/50">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-amber-700 w-5">{index + 1}</span>
                                        <Avatar className="h-8 w-8 border-2 border-amber-200">
                                            <AvatarImage src={seller.avatarUrl} alt={seller.username} />
                                            <AvatarFallback>{seller.username?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-amber-900">{seller.username}</span>
                                    </div>
                                    {/* In a real app, this would show the seller's actual count */}
                                    <span className="text-sm font-semibold text-amber-800">{15 - index * 3} sold</span>
                                </div>
                            ))}
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
