
"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { PlantListing } from '@/models';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';

interface CartItem extends PlantListing {
    quantity: number; // Quantity in cart
    stockQuantity?: number; // Total available quantity from listing
}

interface CartContextType {
    items: CartItem[];
    addToCart: (plant: PlantListing, quantity: number, options?: { showToast?: boolean }) => void;
    removeFromCart: (plantId: string) => void;
    updateQuantity: (plantId: string, quantity: number) => void;
    clearCart: () => void;
    totalPrice: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const { toast } = useToast();
    const { user } = useAuth(); // Get the current user from the auth context

    // This effect will run whenever the user changes (login/logout).
    // It clears the cart to ensure it's user-specific.
    useEffect(() => {
        setItems([]);
    }, [user]);

    const addToCart = useCallback((plant: PlantListing, quantity: number, options: { showToast?: boolean } = { showToast: true }) => {
        if (!plant.id) return;
    
        let itemAdded = false;
        let quantityUpdated = false;
        let finalQuantity = 0;

        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === plant.id);
            const availableStock = plant.quantity || 1;
        
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > availableStock) {
                    if (options.showToast) {
                        toast({
                            variant: 'destructive',
                            title: 'Stock Limit Reached',
                            description: `You can't add more than ${availableStock} of ${plant.name} to your cart.`,
                        });
                    }
                    return prevItems;
                }
                quantityUpdated = true;
                finalQuantity = newQuantity;
                return prevItems.map(item =>
                    item.id === plant.id ? { ...item, quantity: newQuantity } : item
                );
            } else {
                if (quantity > availableStock) {
                     if (options.showToast) {
                        toast({
                            variant: 'destructive',
                            title: 'Stock Limit Reached',
                            description: `Only ${availableStock} of ${plant.name} are available.`,
                        });
                    }
                    return prevItems;
                }
                itemAdded = true;
                finalQuantity = quantity;
                return [...prevItems, { ...plant, quantity, stockQuantity: availableStock }];
            }
        });

        if (options.showToast) {
             if (quantityUpdated) {
                toast({
                    title: 'Cart Updated',
                    description: `Increased ${plant.name} quantity to ${finalQuantity}.`,
                });
            } else if (itemAdded) {
                toast({
                    title: 'Added to Cart',
                    description: `Added ${finalQuantity} of ${plant.name} to your cart.`,
                });
            }
        }
    }, [toast]);

    const removeFromCart = useCallback((plantId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== plantId));
    }, []);
    
    const updateQuantity = useCallback((plantId: string, quantity: number) => {
        setItems(prevItems => {
            const itemToUpdate = prevItems.find(item => item.id === plantId);
            if (!itemToUpdate) return prevItems;
            
            const stock = itemToUpdate.stockQuantity || 1;

            if (quantity < 1) {
                // Remove if quantity is less than 1
                return prevItems.filter(item => item.id !== plantId);
            }

            if (quantity > stock) {
                toast({
                    variant: 'destructive',
                    title: 'Stock Limit Reached',
                    description: `Only ${stock} available.`
                });
                return prevItems.map(item =>
                    item.id === plantId ? { ...item, quantity: stock } : item
                );
            } else {
                 return prevItems.map(item =>
                    item.id === plantId ? { ...item, quantity: quantity } : item
                );
            }
        });
    }, [toast]);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);
    
    const totalPrice = useMemo(() => {
        return items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
    }, [items]);

    const itemCount = useMemo(() => {
        return items.reduce((total, item) => total + item.quantity, 0);
    }, [items]);

    const value = useMemo(() => ({
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        itemCount,
    }), [items, addToCart, removeFromCart, updateQuantity, clearCart, totalPrice, itemCount]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
