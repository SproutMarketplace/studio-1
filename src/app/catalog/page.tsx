
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PlantCard } from "@/components/plant-card";
import type { PlantListing } from "@/models";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ListFilter, Loader2 } from "lucide-react";
import { subscribeToAvailablePlantListings } from "@/lib/firestoreService";
import type { Timestamp } from "firebase/firestore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/cart-context";
import { Card } from "@/components/ui/card";


const CATEGORY_OPTIONS = [
  { id: "tropical", label: "Tropical" },
  { id: "cacti", label: "Cacti" },
  { id: "succulent", label: "Succulent" },
  { id: "rare", label: "Rare" },
  { id: "beginner-friendly", label: "Beginner Friendly" },
  { id: "pet-friendly", label: "Pet Friendly" },
  { id: "low-light", label: "Low Light" },
  { id: "flowering", label: "Flowering" },
];

export default function PlantCatalogPage() {
    const [plants, setPlants] = useState<PlantListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState<{
        tradeOnly: 'all' | 'sale' | 'trade';
        sortBy: 'newest' | 'price-asc' | 'price-desc';
        categories: string[];
    }>({
        tradeOnly: 'all',
        sortBy: 'newest',
        categories: [],
    });

    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { clearCart } = useCart();
    
    const memoizedClearCart = useCallback(clearCart, []);

    useEffect(() => {
        const checkoutSuccess = searchParams.get('checkout_success');
        const checkoutCanceled = searchParams.get('canceled');
        let hasParams = false;
        
        if (checkoutSuccess === 'true') {
            hasParams = true;
            toast({
                title: "Payment Successful!",
                description: "Thank you for your purchase. Your order is being processed.",
            });
            memoizedClearCart();
        }

        if (checkoutCanceled === 'true') {
            hasParams = true;
            toast({
                variant: "destructive",
                title: "Payment Canceled",
                description: "Your order was not completed. Your cart has been saved.",
            });
        }
        
        // This is the key change: The router.replace was interfering with the subscription model in some cases.
        // We ensure it only runs once by using a clean URL.
        if (hasParams) {
            router.replace('/catalog', {scroll: false});
        }

        const unsubscribe = subscribeToAvailablePlantListings(
            (fetchedPlants) => {
                setPlants(fetchedPlants);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching plants:", err);
                setError("Failed to load plants. Please try again later.");
                setIsLoading(false);
            }
        );
        
        return () => unsubscribe();
    }, [router, searchParams, toast, memoizedClearCart]);


    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value.toLowerCase());
    };
    
    const processedPlants = useMemo(() => {
        let processed = [...plants];

        // 1. Filter
        processed = processed.filter(plant => {
            const matchesSearch = searchTerm ?
                plant.name.toLowerCase().includes(searchTerm) ||
                plant.description.toLowerCase().includes(searchTerm) ||
                (plant.tags && plant.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
                : true;

            const matchesTradeFilter =
                filters.tradeOnly === 'all' ||
                (filters.tradeOnly === 'sale' && !plant.tradeOnly) ||
                (filters.tradeOnly === 'trade' && plant.tradeOnly);
            
            const plantTags = plant.tags?.map(t => t.toLowerCase().replace(/ /g, '-')) || [];
            const matchesCategoryFilter = filters.categories.length === 0 ||
                filters.categories.every(category => plantTags.includes(category));

            return matchesSearch && matchesTradeFilter && matchesCategoryFilter;
        });

        // 2. Sort
        switch (filters.sortBy) {
            case 'price-asc':
                processed.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
                break;
            case 'price-desc':
                processed.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
                break;
            case 'newest':
            default:
                processed.sort((a, b) => (b.listedDate as Timestamp).toMillis() - (a.listedDate as Timestamp).toMillis());
                break;
        }

        return processed;
    }, [plants, searchTerm, filters]);


    const handleCategoryChange = (categoryId: string) => {
        setFilters(prev => {
            const newCategories = prev.categories.includes(categoryId)
                ? prev.categories.filter(c => c !== categoryId)
                : [...prev.categories, categoryId];
            return { ...prev, categories: newCategories };
        });
    };

    const clearFilters = () => {
        setFilters({
            tradeOnly: 'all',
            sortBy: 'newest',
            categories: [],
        });
    };


    return (
        <div className="container mx-auto space-y-8">
            <Card className="relative overflow-hidden shadow-lg border-none -mx-4 md:-mx-6 lg:-mx-8">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 z-10" />
                <Image
                    src="/plant-images/catalogimage.jpeg"
                    alt="A vibrant collection of house plants arranged on shelves"
                    fill
                    className="object-cover"
                    data-ai-hint="vibrant houseplants"
                />
                <div className="relative z-20 flex h-[400px] flex-col items-center justify-center text-center p-6">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl drop-shadow-lg">
                        Discover Your Next Plant
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg text-white/90 drop-shadow-md">
                        Browse our community's collection of plants for sale or trade.
                    </p>
                </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4">
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
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="shrink-0 text-lg py-2 h-auto hover:bg-primary/10 hover:text-primary">
                            <ListFilter className="mr-2 h-5 w-5" />
                            Filters
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium leading-none">Filters</h4>
                                <Button variant="link" size="sm" onClick={clearFilters} className="p-0 h-auto text-primary">Clear all</Button>
                            </div>
                            <Separator />

                            <div className="space-y-2">
                                <Label className="font-semibold">Sort by</Label>
                                <RadioGroup
                                    value={filters.sortBy}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="newest" id="sort-newest" />
                                        <Label htmlFor="sort-newest" className="font-normal">Newest First</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="price-asc" id="sort-price-asc" />
                                        <Label htmlFor="sort-price-asc" className="font-normal">Price: Low to High</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="price-desc" id="sort-price-desc" />
                                        <Label htmlFor="sort-price-desc" className="font-normal">Price: High to Low</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <Separator />

                            <div className="space-y-2">
                                <Label className="font-semibold">Listing Type</Label>
                                <RadioGroup
                                    value={filters.tradeOnly}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, tradeOnly: value as any }))}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="all" id="type-all" />
                                        <Label htmlFor="type-all" className="font-normal">All Listings</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sale" id="type-sale" />
                                        <Label htmlFor="type-sale" className="font-normal">For Sale</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="trade" id="type-trade" />
                                        <Label htmlFor="type-trade" className="font-normal">For Trade</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <Separator />

                            <div className="space-y-2">
                                <Label className="font-semibold">Categories</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORY_OPTIONS.map(category => (
                                        <div key={category.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`category-${category.id}`}
                                                checked={filters.categories.includes(category.id)}
                                                onCheckedChange={() => handleCategoryChange(category.id)}
                                            />
                                            <Label htmlFor={`category-${category.id}`} className="font-normal text-sm leading-tight">
                                                {category.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-destructive">
                    <h2 className="text-2xl font-semibold">{error}</h2>
                </div>
            ) : processedPlants.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {processedPlants.map((plant) => (
                        <PlantCard key={plant.id} plant={plant} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold text-muted-foreground">No plants found.</h2>
                    <p className="mt-2 text-muted-foreground">Try adjusting your search or filters, or check back later.</p>
                </div>
            )}
        </div>
    );
