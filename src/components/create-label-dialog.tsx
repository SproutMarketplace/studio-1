
"use client";

import { useState, useEffect } from "react";
import type { Order } from "@/models";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";


export function CreateLabelDialog({ order, isOpen, onOpenChange }: { order: Order | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) {
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

