
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getOrdersForSeller } from "@/lib/firestoreService";
import type { Order } from "@/models";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Banknote, Clock, ArrowRight, Loader2, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Transaction {
    id: string;
    date: string;
    type: 'Sale';
    status: Order['status'];
    amount: number;
    buyer: string;
}

export default function FinancesPage() {
    const { user, loading: authLoading } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchTransactions = async () => {
                setIsLoading(true);
                try {
                    const orders = await getOrdersForSeller(user.uid);
                    
                    const saleTransactions = orders.map(order => {
                        const sellerItems = order.items.filter(item => item.sellerId === user.uid);
                        const sellerTotal = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
                        return {
                            id: order.id!,
                            date: format((order.createdAt as Timestamp).toDate(), "MMM d, yyyy"),
                            type: 'Sale' as const,
                            status: order.status,
                            amount: sellerTotal,
                            buyer: order.buyerUsername || 'Unknown Buyer'
                        }
                    });

                    setTransactions(saleTransactions);
                } catch (error) {
                    console.error("Failed to fetch transactions:", error);
                } finally {
                    setIsLoading(false);
                }
            }
            fetchTransactions();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, authLoading]);

    const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
        switch (status) {
            case 'processing': return 'default';
            case 'shipped': return 'secondary';
            case 'delivered': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'default';
        }
      };

    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <CircleDollarSign className="h-8 w-8" /> Finances
            </h1>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available for Payout</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$0.00</div>
                        <p className="text-xs text-muted-foreground">(Feature coming soon)</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">N/A</div>
                        <p className="text-xs text-muted-foreground">(Feature coming soon)</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Manage Payouts</CardTitle>
                         <CardDescription>Connect your bank account to receive funds.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button disabled className="w-full">
                            Connect Stripe (Coming Soon) <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>
                        A history of your completed sales on Sprout. Payouts will appear here in the future.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : transactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Buyer</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell>{tx.date}</TableCell>
                                        <TableCell>{tx.buyer}</TableCell>
                                        <TableCell>
                                            <Badge variant="default">{tx.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(tx.status)} className="capitalize">{tx.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">${tx.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-12">
                            <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No sales yet</h3>
                            <p className="mt-1 text-muted-foreground">When you sell a plant, your sales will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
