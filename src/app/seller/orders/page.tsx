
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getOrdersForSeller } from "@/lib/firestoreService";
import type { Order, OrderItem } from "@/models";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Inbox, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchOrders = async () => {
                setIsLoading(true);
                try {
                    // This function now correctly fetches orders where the user is the seller
                    const fetchedOrders = await getOrdersForSeller(user.uid);
                    setOrders(fetchedOrders);
                } catch (error) {
                    console.error("Error fetching seller orders:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchOrders();
        } else if (!authLoading) {
            setIsLoading(false);
        }
    }, [user, authLoading]);

    const renderOrderItemsForSeller = (items: OrderItem[]) => {
        const sellerItems = items.filter(item => item.sellerId === user?.uid);

        return (
            <div className="space-y-2">
                {sellerItems.map(item => (
                    <div key={item.plantId} className="flex items-center gap-2 text-sm">
                        <Link href={`/plant/${item.plantId}`} className="flex items-center gap-2 text-sm group">
                            <Image
                                src={item.imageUrl || "https://placehold.co/40x40.png"}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded-md aspect-square object-cover"
                            />
                            <div>
                                <span className="font-medium group-hover:underline">{item.name}</span>
                                <p className="text-muted-foreground text-xs">Qty: {item.quantity} &bull; Price: ${item.price.toFixed(2)}</p>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        );
    };

    const getStatusVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
        switch (status) {
            case 'processing': return 'default';
            case 'shipped': return 'secondary';
            case 'delivered': return 'secondary'; // Could be different color
            case 'cancelled': return 'destructive';
            default: return 'default';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <Package className="h-8 w-8" /> Your Orders
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Sales History</CardTitle>
                    <CardDescription>
                        A list of all the plants you have sold on Sprout.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : orders.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Items Sold</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const sellerTotal = order.items
                                        .filter(item => item.sellerId === user?.uid)
                                        .reduce((acc, item) => acc + (item.price * item.quantity), 0);

                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell>{format((order.createdAt as Timestamp).toDate(), "MMM d, yyyy")}</TableCell>
                                            <TableCell>{order.buyerUsername}</TableCell>
                                            <TableCell>
                                                {renderOrderItemsForSeller(order.items)}
                                            </TableCell>
                                            <TableCell className="font-medium">${sellerTotal.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)} className="capitalize">
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                 <Button variant="outline" size="sm" disabled>
                                                    <Truck className="mr-2 h-4 w-4" />
                                                    Create Label
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                         <div className="text-center py-12">
                            <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No sales yet</h3>
                            <p className="mt-1 text-muted-foreground">When you sell a plant, the order will appear here.</p>
                            <Button asChild className="mt-4"><Link href="/list-plant">List Your First Plant</Link></Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
