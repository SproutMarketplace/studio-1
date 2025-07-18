
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlantListing } from "@/models";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, User, Loader2, ShoppingCart, ChevronLeft, ChevronRight, MessageSquare, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { addPlantToWishlist, removePlantFromWishlist, createOrGetChat } from "@/lib/firestoreService";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { Input } from "@/components/ui/input";


export interface PlantCardProps {
  plant: PlantListing;
}

export function PlantCard({ plant }: PlantCardProps) {
  const { toast } = useToast();
  const { user, profile, loading: authLoading, refreshUserProfile } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const router = useRouter();
  
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);


  const isOwner = user?.uid === plant.ownerId;
  const isInWishlist = profile?.favoritePlants?.includes(plant.id!);
  
  const cartItem = cartItems.find(item => item.id === plant.id);
  const quantityInCart = cartItem?.quantity || 0;
  const availableStock = plant.quantity || 1;
  const maxPurchaseQuantity = availableStock - quantityInCart;

  const handleMessageSeller = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    if (!user) {
        toast({ variant: "destructive", title: "Please log in", description: "You need to be logged in to send a message." });
        return;
    }
    if (!plant || isOwner) return;

    setIsMessaging(true);
    try {
        const chatId = await createOrGetChat(user.uid, plant.ownerId);
        router.push(`/messages/${chatId}`);
    } catch (error) {
        console.error("Failed to start chat:", error);
        toast({ variant: "destructive", title: "Something went wrong", description: "Could not start a conversation." });
        setIsMessaging(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    if (!user || !profile || !plant.id) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You need to be logged in to manage your wishlist.",
      });
      return;
    }

    setIsWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removePlantFromWishlist(user.uid, plant.id);
        toast({
          title: "Removed from Wishlist",
          description: `${plant.name} has been removed from your wishlist.`,
        });
      } else {
        await addPlantToWishlist(user.uid, plant.id);
        toast({
          title: "Added to Wishlist!",
          description: `${plant.name} has been added to your wishlist.`,
        });
      }
      await refreshUserProfile();
    } catch (error) {
      console.error("Wishlist error:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not update your wishlist. Please try again.",
      });
    } finally {
      setIsWishlistLoading(false);
    }
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      addToCart(plant, purchaseQuantity);
  }

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex(prev => (prev - 1 + plant.imageUrls.length) % plant.imageUrls.length);
    setImageError(false); // Reset error on image change
  }
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex(prev => (prev + 1) % plant.imageUrls.length);
    setImageError(false); // Reset error on image change
  }
  
  const placeholderImageUrl = "https://placehold.co/600x400.png";
  const displayImageUrl = plant.imageUrls && plant.imageUrls.length > 0 && !imageError
    ? plant.imageUrls[currentImageIndex] 
    : placeholderImageUrl;

  const displayImageHint = plant.name.toLowerCase().split(" ").slice(0,2).join(" ");

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl group">
        <CardHeader className="p-0">
          <div className="relative w-full h-48 md:h-56 group/image">
            <Link href={`/plant/${plant.id!}`} passHref>
              <Image
                src={displayImageUrl}
                alt={plant.name}
                layout="fill"
                objectFit="cover"
                data-ai-hint={displayImageHint}
                className="transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            </Link>
            {!plant.isAvailable && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-xl font-bold uppercase tracking-wider">Sold Out</span>
              </div>
            )}
            {plant.imageUrls && plant.imageUrls.length > 1 && (
              <>
                <Button size="icon" variant="ghost" onClick={handlePrevImage} className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/50 hover:text-white">
                    <ChevronLeft className="h-5 w-5"/>
                </Button>
                <Button size="icon" variant="ghost" onClick={handleNextImage} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/50 hover:text-white">
                    <ChevronRight className="h-5 w-5"/>
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
            <Link href={`/plant/${plant.id!}`} className="hover:underline">
                {plant.name}
            </Link>
          </CardTitle>
          {plant.price && !plant.tradeOnly && (
            <Badge variant="default" className="text-lg shrink-0">
              ${plant.price.toFixed(2)}
            </Badge>
          )}
           {!plant.price && !plant.tradeOnly && (
            <Badge variant="default" className="text-lg shrink-0">
              Free
            </Badge>
          )}
        </div>
        
        <div className="mb-2 flex flex-wrap gap-1">
          {plant.tradeOnly ? (
             <Badge variant="secondary">For Trade</Badge>
          ) : (
            <>
              {!plant.price && <Badge>Free</Badge>}
              {(plant.price || 0) > 0 && <Badge>For Sale</Badge>}
            </>
          )}
        </div>

        <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-2 h-[2.5rem] flex-grow">
          {plant.description}
        </CardDescription>

        <div className="flex justify-between items-center text-sm font-semibold mt-auto">
            {plant.quantity && plant.quantity > 0 ? (
                <p className="text-green-600">{plant.quantity} in stock</p>
            ) : (
                <p className="text-destructive">Out of stock</p>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col gap-2 items-start">
         <div className="w-full text-xs text-muted-foreground space-y-1 mb-2">
          <div className="flex items-center">
            <Link href={`/profile/${plant.ownerId}`} className="flex items-center hover:underline" onClick={(e) => e.stopPropagation()}>
              {plant.ownerAvatarUrl ? (
                <Image src={plant.ownerAvatarUrl} alt={plant.ownerUsername} width={16} height={16} className="w-4 h-4 rounded-full mr-1.5" />
              ) : (
                <User className="w-3 h-3 mr-1.5" />
              )}
                <span>{plant.ownerUsername}</span>
            </Link>
          </div>
          {plant.location && (
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1.5" /> {plant.location}
            </div>
          )}
        </div>

         {!isOwner && plant.isAvailable && (
          <div className="w-full flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="group/button px-2.5" 
              onClick={handleWishlistToggle}
              disabled={authLoading || isWishlistLoading}
              aria-label={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              {isWishlistLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className={cn("w-4 h-4 transition-colors group-hover/button:fill-destructive group-hover/button:text-destructive", isInWishlist && "fill-destructive text-destructive")} />
              )}
            </Button>

            {plant.tradeOnly ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full group/button"
                onClick={handleMessageSeller}
                disabled={authLoading || isMessaging}
              >
                {isMessaging ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4 mr-2" />
                )}
                Message Seller
              </Button>
            ) : (
              <div className="w-full flex items-center gap-2">
                <div className="flex items-center rounded-md border">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => { e.stopPropagation(); setPurchaseQuantity(q => Math.max(1, q - 1)); }}
                        disabled={purchaseQuantity <= 1}
                    >
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{purchaseQuantity}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={(e) => { e.stopPropagation(); setPurchaseQuantity(q => Math.min(maxPurchaseQuantity, q + 1)); }}
                        disabled={purchaseQuantity >= maxPurchaseQuantity}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full group/button"
                    onClick={handleAddToCart}
                    disabled={maxPurchaseQuantity <= 0}
                >
                    <ShoppingCart className="w-4 h-4 mr-2"/>
                    {maxPurchaseQuantity <= 0 ? "Out of Stock" : "Add"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
