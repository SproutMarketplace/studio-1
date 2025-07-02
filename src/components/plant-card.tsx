
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlantListing } from "@/models";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, User, Loader2, ShoppingCart, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { addPlantToWishlist, removePlantFromWishlist, createOrGetChat } from "@/lib/firestoreService";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";


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

  const isOwner = user?.uid === plant.ownerId;
  const isInWishlist = profile?.favoritePlants?.includes(plant.id!);
  const isInCart = cartItems.some(item => item.id === plant.id);

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
      addToCart(plant);
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

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "for sale":
        return "bg-primary text-primary-foreground hover:bg-primary/90";
      case "for trade":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80"; 
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80"; 
    }
  };
  
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
                <span className="text-white text-xl font-bold uppercase tracking-wider">Sold</span>
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
        <CardContent className="p-4 flex-grow">
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
              <Badge>For Sale</Badge>
              {plant.price === undefined || plant.price === null ? null : (
                 <Badge variant="secondary">For Trade</Badge>
              )}
            </>
          )}

          {plant.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>

        <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3 h-[3.75rem]">
          {plant.description}
        </CardDescription>
        <div className="text-xs text-muted-foreground space-y-1">
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
      </CardContent>
      <CardFooter className="p-4 border-t flex gap-2">
         {!isOwner && plant.isAvailable && (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              className="group/button" 
              onClick={handleWishlistToggle}
              disabled={authLoading || isWishlistLoading}
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
              <Button
                variant="outline"
                size="sm"
                className="w-full group/button"
                onClick={handleAddToCart}
                disabled={isInCart}
              >
                <ShoppingCart className={cn("w-4 h-4 mr-2 transition-colors", isInCart && "text-primary")} />
                {isInCart ? "In Cart" : "Add to Cart"}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}

    