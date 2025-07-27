
"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart, Trash2, Minus, Plus } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const isStripeDisabled = !stripePublishableKey || stripePublishableKey.includes('_PUT_YOUR_STRIPE_PUBLISHABLE_KEY_HERE_');

const stripePromise = !isStripeDisabled ? loadStripe(stripePublishableKey!) : null;

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void; }) {
    const { items, removeFromCart, updateQuantity, totalPrice, itemCount } = useCart();
    const { user, profile } = useAuth();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const { toast } = useToast();
    
    const BUYER_FEE_PERCENTAGE = 0.045; // 4.5%
    const isElite = profile?.subscriptionTier === 'elite';
    const platformFee = isElite ? 0 : totalPrice * BUYER_FEE_PERCENTAGE;
    const finalTotal = totalPrice + platformFee;

    async function handleCheckout() {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Logged In',
                description: 'You must be logged in to proceed to checkout.'
            });
            return;
        }

        if (!stripePromise) {
            toast({
                variant: 'destructive',
                title: 'Checkout Disabled',
                description: 'Payment processing is not configured correctly. Please provide a valid Stripe key.'
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
                body: JSON.stringify({ 
                    items, 
                    userId: user.uid, 
                    type: 'one-time',
                    subscriptionTier: profile?.subscriptionTier || 'free',
                }),
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
                            <div className="flex flex-col gap-6 p-6 pr-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-start space-x-4">
                                        <div className="relative h-20 w-20 overflow-hidden rounded-md">
                                            <Image
                                                src={item.imageUrls[0] || 'https://placehold.co/100x100.png'}
                                                alt={item.name}
                                                layout="fill"
                                                objectFit="cover"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-1.5 self-start text-sm">
                                            <span className="font-semibold">{item.name}</span>
                                            <span className="text-muted-foreground">
                                                {item.price ? `$${item.price.toFixed(2)}` : 'Free'}
                                            </span>
                                             <div className="flex items-center border rounded-md w-fit">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="w-8 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                                                    disabled={item.quantity >= (item.stockQuantity || 1)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                            <div className="w-full space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p>${totalPrice.toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Platform Fee</p>
                                    <p>{isElite ? <span className="line-through">${(totalPrice * BUYER_FEE_PERCENTAGE).toFixed(2)}</span> : `$${platformFee.toFixed(2)}`}</p>
                                </div>
                                {isElite && (
                                    <div className="flex justify-between text-primary font-semibold">
                                        <p>Elite Plan Discount</p>
                                        <p>-${(totalPrice * BUYER_FEE_PERCENTAGE).toFixed(2)}</p>
                                    </div>
                                )}
                                <Separator className="my-2"/>
                                 <div className="flex justify-between text-base font-semibold">
                                    <p>Total</p>
                                    <p>${finalTotal.toFixed(2)}</p>
                                </div>
                                <Button
                                    className="w-full text-lg mt-4"
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut || isStripeDisabled}
                                >
                                    {isCheckingOut ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        "Proceed to Checkout"
                                    )}
                                </Button>
                                {isStripeDisabled && (
                                    <p className="text-xs text-center text-muted-foreground">Checkout is disabled. Admin needs to configure Stripe keys.</p>
                                )}
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
