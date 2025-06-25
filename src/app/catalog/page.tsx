
"use client";

import { useEffect, useState } from "react";
import { PlantCard } from "@/components/plant-card";
import type { Plant } from "@/models";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ListFilter, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, where, limit, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PLANTS_PER_PAGE = 8;

export default function PlantCatalogPage() {
    const [plants, setPlants] = useState<Plant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<{ type: string[]; tags: string[] }>({ type: [], tags: [] });

    const fetchPlants = async (loadMore = false) => {
        if (!loadMore) {
            setIsLoading(true);
            setPlants([]);
            setLastVisible(null);
            setHasMore(true);
        } else if (!hasMore) {
            return;
        }

        setError(null);

        try {
            let plantsQuery = query(
                collection(db, "plants"),
                orderBy("createdAt", "desc"),
                limit(PLANTS_PER_PAGE)
            );

            if (loadMore && lastVisible) {
                plantsQuery = query(plantsQuery, startAfter(lastVisible));
            }

            // Basic client-side search after fetching initial/paginated batch
            // For more robust search, server-side querying or a search service (Algolia) would be needed.

            const querySnapshot = await getDocs(plantsQuery);
            const fetchedPlants = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plant));

            setPlants(prevPlants => loadMore ? [...prevPlants, ...fetchedPlants] : fetchedPlants);

            const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastVisible(newLastVisible || null);
            setHasMore(querySnapshot.docs.length === PLANTS_PER_PAGE);

        } catch (err) {
            console.error("Error fetching plants:", err);
            setError("Failed to load plants. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Initial fetch

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };

    // Client-side filtering for simplicity. Real app would integrate this into Firestore query
    const filteredPlants = plants.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchTerm) ||
            plant.description.toLowerCase().includes(searchTerm) ||
            (plant.tags && plant.tags.some(tag => tag.toLowerCase().includes(searchTerm)));

        const matchesType = filters.type.length === 0 || filters.type.includes(plant.type);
        // const matchesTags = filters.tags.length === 0 || (plant.tags && filters.tags.every(ft => plant.tags.includes(ft)));

        return matchesSearch && matchesType; // && matchesTags; (Tag filtering can be added)
    });

    const handleFilterChange = (filterType: "type", value: string, checked: boolean) => {
        setFilters(prev => {
            const currentValues = prev[filterType];
            if (checked) {
                return { ...prev, [filterType]: [...currentValues, value] };
            } else {
                return { ...prev, [filterType]: currentValues.filter(v => v !== value) };
            }
        });
    };


    return (
        <div className="container mx-auto">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    Discover Your Next Plant
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Browse our community's collection of plants for sale or trade.
                </p>
            </header>

            <div className="mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, description, tags..."
                        className="w-full rounded-lg bg-background pl-10 pr-4 py-2 text-lg"
                        onChange={handleSearchChange}
                        value={searchTerm}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="shrink-0 text-lg py-2 h-auto">
                            <ListFilter className="mr-2 h-5 w-5" />
                            Filters
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Listing Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={filters.type.includes("sale")}
                            onCheckedChange={(checked) => handleFilterChange("type", "sale", Boolean(checked))}
                        >
                            For Sale
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={filters.type.includes("trade")}
                            onCheckedChange={(checked) => handleFilterChange("type", "trade", Boolean(checked))}
                        >
                            For Trade
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={filters.type.includes("sale_trade")}
                            onCheckedChange={(checked) => handleFilterChange("type", "sale_trade", Boolean(checked))}
                        >
                            Sale or Trade
                        </DropdownMenuCheckboxItem>
                        {/* Future: Add tag filters here */}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {isLoading && plants.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-destructive">
                    <h2 className="text-2xl font-semibold">{error}</h2>
                </div>
            ) : filteredPlants.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredPlants.map((plant) => (
                            <PlantCard key={plant.id} plant={plant} />
                        ))}
                    </div>
                    {hasMore && !isLoading && filteredPlants.length > 0 && (
                        <div className="mt-8 text-center">
                            <Button onClick={() => fetchPlants(true)} disabled={isLoading}>
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : "Load More Plants"}
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold text-muted-foreground">No plants found.</h2>
                    <p className="mt-2 text-muted-foreground">Try adjusting your search or filters, or check back later.</p>
                </div>
            )}
        </div>
    );
}
