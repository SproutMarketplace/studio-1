
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getOrdersForSeller } from "@/lib/firestoreService";
import type { Order, OrderItem } from "@/models";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Banknote, Clock, ArrowRight, Loader2, Inbox, CheckCircle2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Transaction {
    id: string;
    date: string;
    type: 'Sale';
    status: Order['status'];
    amount: number; // Net amount after fees
    buyer: string;
}

export default function FinancesPage() {
    const { user, profile, loading: authLoading, refreshUserProfile } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnectingStripe, setIsConnectingStripe] = useState(false);
    const [hasProcessedStripeReturn, setHasProcessedStripeReturn] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    useEffect(() => {
        const stripeReturn = searchParams.get('stripe_return');
        if (stripeReturn === 'true' && !hasProcessedStripeReturn) {
            setHasProcessedStripeReturn(true); // Prevent this from running again
            toast({
                title: "Welcome back!",
                description: "Verifying your account with Stripe. This may take a moment...",
            });
            refreshUserProfile(); 
            router.replace('/seller/finances', { scroll: false });
        }

        const stripeRefresh = searchParams.get('stripe_refresh');
        if (stripeRefresh) {
            toast({
                variant: 'destructive',
                title: "Connection Timed Out",
                description: "The secure connection to Stripe timed out. Please try again.",
            });
            router.replace('/seller/finances', { scroll: false });
        }
    }, [searchParams, hasProcessedStripeReturn, refreshUserProfile, router, toast]);


    useEffect(() => {
        if (user) {
            const fetchTransactions = async () => {
                setIsLoading(true);
                try {
                    const orders = await getOrdersForSeller(user.uid);
                    
                    const saleTransactions = orders.map(order => {
                        const sellerItems = order.items.filter(item => item.sellerId === user.uid);
                        
                        const sellerNetTotal = sellerItems.reduce((acc, item) => {
                            const itemTotal = item.price * item.quantity;
                            const fee = item.platformFee || 0;
                            return acc + (itemTotal - fee);
                        }, 0);

                        return {
                            id: order.id!,
                            date: format((order.createdAt as Timestamp).toDate(), "MMM d, yyyy"),
                            type: 'Sale' as const,
                            status: order.status,
                            amount: sellerNetTotal,
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

    const handleStripeConnect = async () => {
        if (!user) return;
        setIsConnectingStripe(true);
        try {
            const response = await fetch('/api/stripe/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to create Stripe connection link.');
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Stripe Connection Failed',
                description: error instanceof Error ? error.message : 'An unknown error occurred.',
            });
            setIsConnectingStripe(false);
        }
    };
    
    const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
        switch (status) {
            case 'processing': return 'default';
            case 'shipped': return 'secondary';
            case 'delivered': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'default';
        }
      };

    const renderStripeCardContent = () => {
        if (authLoading) {
            return <CardContent className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></CardContent>;
        }
        
        if (profile?.stripeDetailsSubmitted) {
            return (
                <CardContent>
                    <div className="flex items-center text-green-600 mb-2">
                        <CheckCircle2 className="h-4 w-4 mr-2"/>
                        <p className="text-sm font-medium">Your account is ready to receive payouts.</p>
                    </div>
                    <Button onClick={handleStripeConnect} disabled={isConnectingStripe} className="w-full">
                        {isConnectingStripe ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Manage Payouts on Stripe
                    </Button>
                </CardContent>
            );
        }

        if (profile?.stripeAccountId) {
            return (
                <CardContent>
                    <p className="text-sm text-amber-600 mb-2">Finish setting up your Stripe account to get paid.</p>
                     <Button onClick={handleStripeConnect} disabled={isConnectingStripe} className="w-full">
                        {isConnectingStripe ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Continue Onboarding
                    </Button>
                </CardContent>
            );
        }

        return (
            <CardContent>
                <Button onClick={handleStripeConnect} disabled={isConnectingStripe} className="w-full">
                    {isConnectingStripe ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ArrowRight className="mr-2 h-4 w-4" />}
                    Connect Stripe to Get Paid
                </Button>
            </CardContent>
        );
    }


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
                    {renderStripeCardContent()}
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>
                        A history of your completed sales on Sprout. Earnings are shown net of platform fees.
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
                                    <TableHead className="text-right">Net Earnings</TableHead>
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
