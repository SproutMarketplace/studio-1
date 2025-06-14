
import { PlantCard } from "@/components/plant-card";
import { mockPlants } from "@/lib/plant-data";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function PlantCatalogPage() {
  // In a real app, plants would be fetched from an API and filtering would be implemented
  const plants = mockPlants;

  return (
    <div className="container mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Discover Your Next Plant
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Browse our community's collection of plants for sale or trade.
        </p>
      </header>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for plants (e.g., Monstera, Pothos...)"
            className="w-full rounded-lg bg-background pl-10 pr-4 py-2 text-lg"
          />
        </div>
        {/* Add filter buttons or dropdowns here in a real app */}
      </div>

      {plants.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-muted-foreground">No plants found.</h2>
          <p className="mt-2 text-muted-foreground">Check back later or try adjusting your search.</p>
        </div>
      )}
    </div>
  );
}
