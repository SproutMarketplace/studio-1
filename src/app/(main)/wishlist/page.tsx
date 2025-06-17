
import { Heart, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlantCard } from "@/components/plant-card";
import { mockPlants } from "@/lib/plant-data"; 

export default function WishlistPage() {
  const wishlistItems = mockPlants.slice(0, 2); 

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start mb-2">
          <Heart className="w-10 h-10 mr-3 text-destructive fill-destructive" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            My Wishlist
          </h1>
        </div>
        <p className="mt-1 text-lg text-muted-foreground">
          Your favorite plants, all in one place.
        </p>
      </header>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistItems.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border-2 border-dashed border-border bg-muted/30">
          <SearchX className="w-20 h-20 mb-6 text-muted-foreground" />
          <h2 className="text-2xl font-semibold text-foreground">Your Wishlist is Empty</h2>
          <p className="mt-2 mb-6 text-muted-foreground">
            Start exploring and add some plants you love!
          </p>
          <Button asChild size="lg">
            <Link href="/catalog">Browse Plants</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
