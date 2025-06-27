
"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const { items, removeFromCart, totalPrice, itemCount } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const { toast } = useToast();

    async function handleCheckout() {
        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
            console.error("Stripe publishable key is not set. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your environment variables.");
            toast({
                variant: 'destructive',
                title: 'Configuration Error',
                description: 'Stripe is not configured correctly. Checkout is disabled.'
            });
            return;
        }

        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items }),
            });

            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.error || 'Failed to create checkout session');
            }

            const { sessionId } = await response.json();
            const stripe = await stripePromise;
            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId });
                if (error) {
                    throw new Error(error.message);
                }
            }
        } catch (error) {
            console.error("Checkout error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Checkout Failed",
                description: errorMessage,
            });
        } finally {
            setIsCheckingOut(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
                <SheetHeader className="px-6">
                    <SheetTitle>Shopping Cart ({itemCount})</SheetTitle>
                    <SheetDescription>
                        Review your items below and proceed to checkout.
                    </SheetDescription>
                </SheetHeader>
                <Separator />
                {itemCount > 0 ? (
                    <>
                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-4 p-6 pr-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center space-x-4">
                                        <div className="relative h-16 w-16 overflow-hidden rounded-md">
                                            <Image
                                                src={item.imageUrls[0] || 'https://placehold.co/100x100.png'}
                                                alt={item.name}
                                                layout="fill"
                                                objectFit="cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-1 self-start text-sm">
                                            <span className="font-semibold">{item.name}</span>
                                            <span className="text-muted-foreground">
                                                {item.price ? `$${item.price.toFixed(2)}` : 'Free'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeFromCart(item.id!)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove item</span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <Separator />
                        <SheetFooter className="px-6 py-4">
                            <div className="w-full space-y-4">
                                <div className="flex justify-between text-base font-semibold">
                                    <p>Subtotal</p>
                                    <p>${totalPrice.toFixed(2)}</p>
                                </div>
                                <Button
                                    className="w-full text-lg"
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                >
                                    {isCheckingOut ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        "Proceed to Checkout"
                                    )}
                                </Button>
                            </div>
                        </SheetFooter>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center space-y-4">
                        <ShoppingCart className="h-24 w-24 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Your cart is empty</h3>
                        <p className="text-sm text-muted-foreground">Add some plants to get started!</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
