
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getUserPlantListings } from "@/lib/firestoreService";
import type { PlantListing } from "@/models";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Inbox, Gem, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";


export default function FeatureListingPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [userPlants, setUserPlants] = useState<PlantListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFeaturing, setIsFeaturing] = useState(false);
    
    const [selectedPlant, setSelectedPlant] = useState<PlantListing | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            const fetchPlants = async () => {
                setIsLoading(true);
                try {
                    const plants = await getUserPlantListings(user.uid);
                    setUserPlants(plants.filter(p => p.isAvailable));
                } catch (error) {
                    console.error("Failed to fetch user plants:", error);
                    toast({ variant: 'destructive', title: 'Could not load your plant listings.' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPlants();
        } else if (!authLoading) {
             setIsLoading(false);
        }
    }, [user, authLoading, toast]);
    
    const handleFeatureClick = (plant: PlantListing) => {
        setSelectedPlant(plant);
        setIsDialogOpen(true);
    };

    const handleConfirmFeature = async () => {
        if (!selectedPlant) return;
        
        setIsFeaturing(true);
        // Simulate an API call to feature the listing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real app, you would update the plant document in Firestore,
        // e.g., set `isFeatured: true` and a `featuredUntil: Timestamp`.
        // await updatePlantListing(selectedPlant.id, { isFeatured: true, ... });

        toast({
            title: "Listing Featured! (Simulated)",
            description: `Your "${selectedPlant.name}" listing is now featured.`,
        });

        setIsFeaturing(false);
        setIsDialogOpen(false);
        setSelectedPlant(null);
    }
    
    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Star className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">Feature a Listing</h1>
                    <p className="text-muted-foreground">Boost your listing's visibility by featuring it.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Choose a Listing to Feature</CardTitle>
                    <CardDescription>
                        Select one of your active listings below to promote it. Featured listings appear at the top of search results and on the homepage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading || authLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : userPlants.length > 0 ? (
                        <div className="divide-y divide-border -mx-6">
                            {userPlants.map(plant => (
                                <div key={plant.id} className="flex items-center justify-between p-4 px-6 hover:bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <Image 
                                            src={plant.imageUrls[0] || 'https://placehold.co/80x80.png'}
                                            alt={plant.name}
                                            width={64}
                                            height={64}
                                            className="rounded-md object-cover aspect-square"
                                        />
                                        <div>
                                            <p className="font-semibold">{plant.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {plant.tradeOnly ? "For Trade" : `$${plant.price?.toFixed(2)}`}
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={() => handleFeatureClick(plant)}>
                                        <Star className="mr-2 h-4 w-4"/>
                                        Feature
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12">
                            <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No active listings available</h3>
                            <p className="mt-1 text-muted-foreground">You can only feature listings that are currently available for sale or trade.</p>
                            <Button asChild className="mt-4"><Link href="/list-plant">List a Plant</Link></Button>
                        </div>
                    )}
                </CardContent>
            </Card>

             <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Feature Your Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                            This is a premium feature available to Sprout Pro subscribers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 space-y-4">
                        <p>You are about to feature <span className="font-semibold text-primary">{selectedPlant?.name}</span>.</p>
                        <div className="p-4 rounded-lg bg-primary/10 flex items-center gap-4">
                            <Gem className="h-8 w-8 text-primary"/>
                            <div>
                                <p className="font-semibold">This action costs 1 Pro Credit.</p>
                                <p className="text-sm text-muted-foreground">
                                    Your listing will be featured for 7 days.
                                </p>
                            </div>
                        </div>
                         <Button asChild variant="link" className="p-0 h-auto">
                            <Link href="/subscription" target="_blank">Learn more about Sprout Pro <ExternalLink className="ml-2 h-3 w-3"/></Link>
                        </Button>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isFeaturing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmFeature} disabled={isFeaturing}>
                            {isFeaturing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                            ) : (
                                <Star className="mr-2 h-4 w-4"/>
                            )}
                            Confirm and Feature
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
