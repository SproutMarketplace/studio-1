
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PlantListing } from "@/models";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, User, Loader2, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { addPlantToWishlist, removePlantFromWishlist } from "@/lib/firestoreService";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";


export interface PlantCardProps {
  plant: PlantListing;
}

export function PlantCard({ plant }: PlantCardProps) {
  const { toast } = useToast();
  const { user, profile, loading: authLoading, refreshUserProfile } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isInWishlist = profile?.favoritePlants?.includes(plant.id!);
  const isTradeOnly = plant.tradeOnly && (plant.price === undefined || plant.price === null);
  const isInCart = cartItems.some(item => item.id === plant.id);

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
  }
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentImageIndex(prev => (prev + 1) % plant.imageUrls.length);
  }

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "for sale":
        return "bg-primary text-primary-foreground hover:bg-primary/90";
      case "for trade":
        return "bg-[#664121] text-white hover:bg-[#52341A]"; 
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80"; 
    }
  };
  
  const displayImageUrl = plant.imageUrls && plant.imageUrls.length > 0 
    ? plant.imageUrls[currentImageIndex] 
    : "https://placehold.co/600x400.png";

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
            <Badge variant="default" className="text-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              ${plant.price.toFixed(2)}
            </Badge>
          )}
           {!plant.price && !plant.tradeOnly && (
            <Badge variant="default" className="text-lg bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
              Free
            </Badge>
          )}
        </div>
        
        <div className="mb-2 flex flex-wrap gap-1">
          {plant.tradeOnly ? (
             <Badge className={`${getTagColor("For Trade")}`}>For Trade</Badge>
          ) : (
            <>
              <Badge className={`${getTagColor("For Sale")}`}>For Sale</Badge>
              {plant.price === undefined || plant.price === null ? null : (
                 <Badge className={`${getTagColor("For Trade")}`}>For Trade</Badge>
              )}
            </>
          )}

          {plant.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} className={`${getTagColor(tag)}`}>
              {tag}
            </Badge>
          ))}
        </div>

        <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3 h-[3.75rem]">
          {plant.description}
        </CardDescription>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center">
            {plant.ownerAvatarUrl ? (
              <Image src={plant.ownerAvatarUrl} alt={plant.ownerUsername} width={16} height={16} className="w-4 h-4 rounded-full mr-1.5" />
            ) : (
              <User className="w-3 h-3 mr-1.5" />
            )}
              {plant.ownerUsername}
          </div>
          {plant.location && (
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1.5" /> {plant.location}
            </div>

          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full group/button hover:bg-muted hover:text-muted-foreground" 
          onClick={handleWishlistToggle}
          disabled={!plant.isAvailable || authLoading || isWishlistLoading}
        >
          {isWishlistLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Heart className={cn("w-4 h-4 mr-2 transition-colors group-hover/button:fill-destructive group-hover/button:text-destructive", isInWishlist && "fill-destructive text-destructive")} />
          )}
          {isInWishlist ? 'In Wishlist' : 'Wishlist'}
        </Button>
        {!isTradeOnly && (
          <Button
              variant="outline"
              size="sm"
              className="w-full group/button hover:bg-primary/10 hover:text-primary"
              onClick={handleAddToCart}
              disabled={!plant.isAvailable || isInCart}
          >
              <ShoppingCart className={cn("w-4 h-4 mr-2 transition-colors", isInCart && "text-primary")} />
              {isInCart ? "In Cart" : "Add to Cart"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
