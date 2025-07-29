"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getOrdersForSeller } from "@/lib/firestoreService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Leaf, Loader2 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

interface MonthlySales {
    month: string;
    sales: number;
}

interface TopPlant {
    name: string;
    sales: number;
}

export default function StatsPage() {
    const { user, loading: authLoading } = useAuth();
    const [monthlySalesData, setMonthlySalesData] = useState<MonthlySales[]>([]);
    const [topPlantsData, setTopPlantsData] = useState<TopPlant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchAndProcessStats = async () => {
                setIsLoading(true);
                try {
                    const orders = await getOrdersForSeller(user.uid);
                    
                    // Process for monthly sales
                    const monthlySales: { [key: string]: number } = {};
                    orders.forEach(order => {
                        const month = format((order.createdAt as Timestamp).toDate(), "MMM yy");
                        const sellerItems = order.items.filter(item => item.sellerId === user.uid);
                        const saleCount = sellerItems.reduce((acc, item) => acc + item.quantity, 0);
                        if (!monthlySales[month]) {
                            monthlySales[month] = 0;
                        }
                        monthlySales[month] += saleCount;
                    });
                    
                    const last6Months = Array.from({ length: 6 }, (_, i) => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - i);
                        return format(d, "MMM yy");
                    }).reverse();

                    const formattedMonthlySales = last6Months.map(month => ({
                        month: month.split(' ')[0], // just 'Jan', 'Feb'
                        sales: monthlySales[month] || 0
                    }));

                    setMonthlySalesData(formattedMonthlySales);
                    
                    // Process for top plants
                    const plantSales: { [key: string]: number } = {};
                    orders.forEach(order => {
                        order.items.forEach(item => {
                            if (item.sellerId === user.uid) {
                                if (!plantSales[item.name]) {
                                    plantSales[item.name] = 0;
                                }
                                plantSales[item.name] += item.quantity;
                            }
                        });
                    });

                    const sortedTopPlants = Object.entries(plantSales)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([name, sales]) => ({ name, sales }));
                        
                    setTopPlantsData(sortedTopPlants);

                } catch (error) {
                    console.error("Failed to fetch stats:", error);
                } finally {
                    setIsLoading(false);
                }
            }
            fetchAndProcessStats();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, authLoading]);

    const renderChart = (data: any[], type: 'monthly' | 'plants') => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-[250px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
        }
        if (data.length === 0) {
            return <div className="flex justify-center items-center h-[250px] text-muted-foreground">No sales data yet.</div>;
        }
        if (type === 'monthly') {
            return (
                <ChartContainer config={{ sales: { label: "Sales", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            <Bar dataKey="sales" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            );
        }
        return (
            <ChartContainer config={{ sales: { label: "Sales", color: "hsl(var(--secondary))" } }} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={data} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" dataKey="sales" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        <Bar dataKey="sales" layout="vertical" radius={4} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
        );
    }
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <BarChart3 className="h-8 w-8" /> Statistics
            </h1>
            <div className="grid gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/>Sales Over Time</CardTitle>
                        <CardDescription>Your plant sales over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderChart(monthlySalesData, 'monthly')}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5"/>Top Performing Plants</CardTitle>
                        <CardDescription>Your most popular plant listings by units sold.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderChart(topPlantsData, 'plants')}
                    </CardContent>
                </Card>
            </div>
             <Card className="mt-6">
                <CardHeader>
                    <CardTitle>More Analytics Coming Soon</CardTitle>
                    <CardDescription>
                        We're working on adding more in-depth analytics, including views, conversion rates, and customer demographics. Check back for updates!
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    )
}
