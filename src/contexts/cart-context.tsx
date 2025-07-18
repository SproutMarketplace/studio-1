
"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { PlantListing } from '@/models';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends PlantListing {
    quantity: number; // Quantity in cart
    stockQuantity?: number; // Total available quantity from listing
}

interface CartContextType {
    items: CartItem[];
    addToCart: (plant: PlantListing, quantity: number) => void;
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

    const addToCart = useCallback((plant: PlantListing, quantity: number) => {
        if (!plant.id) return;

        setItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.id === plant.id);
            const availableStock = plant.quantity || 1;

            if (existingItemIndex > -1) {
                // Item exists, update its quantity
                const newItems = [...prevItems];
                const newQuantity = newItems[existingItemIndex].quantity + quantity;
                
                if (newQuantity > availableStock) {
                     toast({
                        variant: 'destructive',
                        title: 'Stock Limit Reached',
                        description: `You can't add more than ${availableStock} of ${plant.name} to your cart.`,
                    });
                    return prevItems; // Return original items without change
                }
                newItems[existingItemIndex].quantity = newQuantity;
                toast({
                    title: 'Cart Updated',
                    description: `Increased ${plant.name} quantity to ${newQuantity}.`,
                });
                return newItems;

            } else {
                // Item doesn't exist, add it
                if (quantity > availableStock) {
                    toast({
                        variant: 'destructive',
                        title: 'Stock Limit Reached',
                        description: `Only ${availableStock} of ${plant.name} are available.`,
                    });
                    return prevItems;
                }
                 toast({
                    title: 'Added to Cart',
                    description: `Added ${quantity} of ${plant.name} to your cart.`,
                });
                return [...prevItems, { ...plant, quantity: quantity, stockQuantity: availableStock }];
            }
        });
    }, [toast]);

    const removeFromCart = useCallback((plantId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== plantId));
    }, []);
    
    const updateQuantity = useCallback((plantId: string, quantity: number) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            const itemIndex = newItems.findIndex(item => item.id === plantId);
            if (itemIndex > -1) {
                const stock = newItems[itemIndex].stockQuantity || 1;
                if (quantity < 1) {
                    // Remove if quantity is less than 1
                    return newItems.filter(item => item.id !== plantId);
                }
                if (quantity > stock) {
                    toast({
                        variant: 'destructive',
                        title: 'Stock Limit Reached',
                        description: `Only ${stock} available.`
                    });
                    newItems[itemIndex].quantity = stock;
                } else {
                    newItems[itemIndex].quantity = quantity;
                }
            }
            return newItems;
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

    