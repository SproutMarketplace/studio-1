
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getOrdersForSeller } from "@/lib/firestoreService";
import type { Order, OrderItem } from "@/models";
import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

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
import { Loader2, Package, Inbox, Truck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function CreateLabelDialog({ order, isOpen, onOpenChange }: { order: Order | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);
    const [labelInfo, setLabelInfo] = useState<{labelUrl: string, trackingNumber: string} | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            // Reset state when dialog is closed
            setIsCreatingLabel(false);
            setLabelInfo(null);
        }
    }, [isOpen]);

    const handleCreateLabel = async () => {
        if (!order) return;
        setIsCreatingLabel(true);
        try {
            const response = await fetch('/api/shipping/create-label', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id }), // Pass order details here in a real app
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create label.');
            }

            setLabelInfo(result);
            toast({ title: "Success!", description: "Shipping label created successfully." });

        } catch (error) {
            console.error("Label creation error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Label Creation Failed",
                description: errorMessage,
            });
        } finally {
            setIsCreatingLabel(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Shipping Label</DialogTitle>
                    <DialogDescription>
                        {labelInfo ? "Your label is ready." : "Enter package details to create a shipping label. (Feature coming soon)"}
                    </DialogDescription>
                </DialogHeader>
                {labelInfo ? (
                    <div className="space-y-4 py-4">
                        <p>
                            Tracking Number: <span className="font-mono text-primary">{labelInfo.trackingNumber}</span>
                        </p>
                        <Button asChild className="w-full">
                            <a href={labelInfo.labelUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4"/>
                                View & Print Label
                            </a>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <Card>
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                For this demonstration, we will use default package dimensions and addresses. In a real app, you would enter the package weight and size here.
                            </CardContent>
                        </Card>
                            <DialogFooter>
                            <Button onClick={handleCreateLabel} disabled={isCreatingLabel}>
                                {isCreatingLabel ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Purchasing...
                                    </>
                                ) : (
                                    "Purchase Label"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default function OrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);

    useEffect(() => {
        if (user) {
            const fetchOrders = async () => {
                setIsLoading(true);
                try {
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
    
    const handleOpenDialog = (order: Order) => {
        setSelectedOrder(order);
        setIsLabelDialogOpen(true);
    };

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
            case 'delivered': return 'secondary'; 
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
                                                 <Button variant="outline" size="sm" onClick={() => handleOpenDialog(order)}>
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

            <CreateLabelDialog
                order={selectedOrder}
                isOpen={isLabelDialogOpen}
                onOpenChange={setIsLabelDialogOpen}
            />
        </div>
    );
}
