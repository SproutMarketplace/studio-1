
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
    
        const existingItem = items.find(item => item.id === plant.id);
        const availableStock = plant.quantity || 1;
    
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > availableStock) {
                toast({
                    variant: 'destructive',
                    title: 'Stock Limit Reached',
                    description: `You can't add more than ${availableStock} of ${plant.name} to your cart.`,
                });
                return;
            }
            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === plant.id ? { ...item, quantity: newQuantity } : item
                )
            );
            toast({
                title: 'Cart Updated',
                description: `Increased ${plant.name} quantity to ${newQuantity}.`,
            });
        } else {
            if (quantity > availableStock) {
                toast({
                    variant: 'destructive',
                    title: 'Stock Limit Reached',
                    description: `Only ${availableStock} of ${plant.name} are available.`,
                });
                return;
            }
            setItems(prevItems => [...prevItems, { ...plant, quantity, stockQuantity: availableStock }]);
            toast({
                title: 'Added to Cart',
                description: `Added ${quantity} of ${plant.name} to your cart.`,
            });
        }
    }, [items]);

    const removeFromCart = useCallback((plantId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== plantId));
    }, []);
    
    const updateQuantity = useCallback((plantId: string, quantity: number) => {
        const itemToUpdate = items.find(item => item.id === plantId);
        if (!itemToUpdate) return;
        
        const stock = itemToUpdate.stockQuantity || 1;

        if (quantity < 1) {
            // Remove if quantity is less than 1
            removeFromCart(plantId);
            return;
        }

        if (quantity > stock) {
            toast({
                variant: 'destructive',
                title: 'Stock Limit Reached',
                description: `Only ${stock} available.`
            });
            setItems(prevItems =>
                prevItems.map(item =>
                    item.id === plantId ? { ...item, quantity: stock } : item
                )
            );
        } else {
             setItems(prevItems =>
                prevItems.map(item =>
                    item.id === plantId ? { ...item, quantity: quantity } : item
                )
            );
        }
    }, [items, removeFromCart]);

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
