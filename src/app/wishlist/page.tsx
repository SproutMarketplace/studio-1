
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getWishlistPlants } from "@/lib/firestoreService";
import type { PlantListing } from "@/models";

import { PlantCard } from "@/components/plant-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Frown } from "lucide-react";

export default function WishlistPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [wishlistPlants, setWishlistPlants] = useState<PlantListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Re-fetch when user or their profile's favoritePlants changes
    if (user?.uid) {
      const fetchWishlist = async () => {
        setIsLoading(true);
        try {
          const plants = await getWishlistPlants(user.uid);
          setWishlistPlants(plants);
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
          // Optionally show a toast notification
        } finally {
          setIsLoading(false);
        }
      };
      fetchWishlist();
    } else if (!authLoading) {
      // User is not logged in
      setWishlistPlants([]);
      setIsLoading(false);
    }
  }, [user, authLoading, profile?.favoritePlants]);

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>View Your Wishlist</CardTitle>
            <CardDescription>Please log in to see the plants you've saved.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Login to View Wishlist</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl flex items-center justify-center gap-3">
            <Heart className="w-10 h-10"/> Your Wishlist
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
            The plants you're dreaming of, all in one place.
        </p>
      </header>

      {wishlistPlants.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistPlants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center mb-4">
                        <Frown className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-semibold text-muted-foreground">Your wishlist is empty.</h2>
                    <p className="mt-2 text-muted-foreground">Browse the catalog and click the heart icon to save plants here.</p>
                    <Button asChild className="mt-6">
                        <Link href="/catalog">Find Plants</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
