"use client";

import Image from "next/image";
import type { Plant } from "@/lib/plant-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  const { toast } = useToast();

  const handleAddToWishlist = () => {
    // In a real app, this would interact with a wishlist state/API
    toast({
      title: "Added to Wishlist!",
      description: `${plant.name} has been added to your wishlist.`,
    });
  };

  const getTradeTypeText = (type: Plant["type"]) => {
    switch (type) {
      case "sale":
        return "For Sale";
      case "trade":
        return "For Trade";
      case "sale_trade":
        return "Sale or Trade";
      default:
        return "";
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="relative w-full h-48 md:h-56">
          <Image
            src={plant.imageUrl}
            alt={plant.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={plant.imageHint}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl font-semibold">{plant.name}</CardTitle>
          {plant.price && (
            <Badge variant="secondary" className="text-lg">
              ${plant.price}
            </Badge>
          )}
        </div>
        <Badge variant={plant.type === "sale" ? "default" : "outline"} className="mb-2">
          {getTradeTypeText(plant.type)}
        </Badge>
        <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {plant.description}
        </CardDescription>
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center">
            <User className="w-3 h-3 mr-1.5" /> {plant.seller}
          </div>
          <div className="flex items-center">
            <MapPin className="w-3 h-3 mr-1.5" /> {plant.location}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button variant="outline" size="sm" className="w-full group" onClick={handleAddToWishlist}>
          <Heart className="w-4 h-4 mr-2 group-hover:fill-destructive group-hover:text-destructive transition-colors" />
          Add to Wishlist
        </Button>
      </CardFooter>
    </Card>
  );
}
