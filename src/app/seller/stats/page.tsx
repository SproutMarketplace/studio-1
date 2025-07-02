
"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Leaf } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"


const monthlySalesData = [
  { month: 'Jan', sales: 4 },
  { month: 'Feb', sales: 3 },
  { month: 'Mar', sales: 5 },
  { month: 'Apr', sales: 7 },
  { month: 'May', sales: 6 },
  { month: 'Jun', sales: 10 },
];

const topPlantsData = [
    { name: 'Monstera D.', sales: 25 },
    { name: 'Pothos', sales: 18 },
    { name: 'Snake Plant', sales: 15 },
    { name: 'Fiddle Leaf', sales: 12 },
    { name: 'ZZ Plant', sales: 8 },
];


export default function StatsPage() {
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
                        <ChartContainer config={{
                            sales: {
                                label: "Sales",
                                color: "hsl(var(--primary))",
                            },
                        }} className="h-[250px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlySalesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent />}
                                />
                                <Bar dataKey="sales" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5"/>Top Performing Plants</CardTitle>
                        <CardDescription>Your most popular plant listings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{
                            sales: {
                                label: "Sales",
                                color: "hsl(var(--secondary))",
                            },
                        }} className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={topPlantsData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" dataKey="sales" />
                                    <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                    <Bar dataKey="sales" layout="vertical" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
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
