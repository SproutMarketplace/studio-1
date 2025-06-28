
"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { PlantListing } from '@/models';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends PlantListing {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (plant: PlantListing) => void;
    removeFromCart: (plantId: string) => void;
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

    const addToCart = (plant: PlantListing) => {
        if (!plant.id) return;

        const existingItem = items.find(item => item.id === plant.id);

        if (existingItem) {
            toast({
                variant: 'destructive',
                title: 'Already in Cart',
                description: `${plant.name} is already in your cart.`,
            });
            return;
        }
        
        setItems(prevItems => [...prevItems, { ...plant, quantity: 1 }]);
        toast({
            title: 'Added to Cart',
            description: `Added ${plant.name} to your cart.`,
        });
    };

    const removeFromCart = (plantId: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== plantId));
    };

    const clearCart = () => {
        setItems([]);
    };
    
    const totalPrice = useMemo(() => {
        return items.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
    }, [items]);

    const itemCount = useMemo(() => {
        return items.length;
    }, [items]);

    const value = {
        items,
        addToCart,
        removeFromCart,
        clearCart,
        totalPrice,
        itemCount,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
