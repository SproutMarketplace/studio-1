
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { deletePlantListing, getPlantListing, createOrGetChat, followUser, unfollowUser } from "@/lib/firestoreService";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { addPlantToWishlist, removePlantFromWishlist } from "@/lib/firestoreService";
import type { PlantListing } from "@/models";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import type { Timestamp } from "firebase/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Heart, ShoppingCart, ChevronLeft, ChevronRight, MapPin, Calendar, Tag, User as UserIcon, Trash2, Pencil, MessageSquare, UserPlus, UserCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PlantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const plantId = params.plantId as string;
    const { toast } = useToast();

    const { user, profile, loading: authLoading, refreshUserProfile } = useAuth();
    const { addToCart, items: cartItems } = useCart();
    
    const [plant, setPlant] = useState<PlantListing | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isWishlistLoading, setIsWishlistLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMessaging, setIsMessaging] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => {
        if (plantId) {
            const fetchPlant = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const fetchedPlant = await getPlantListing(plantId);
                    if (fetchedPlant) {
                        setPlant(fetchedPlant);
                    } else {
                        setError("Plant not found.");
                    }
                } catch (e) {
                    console.error("Error fetching plant:", e);
                    setError("Failed to load plant data.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPlant();
        }
        
        const isNewListing = searchParams.get('new_listing');
        if (isNewListing) {
            toast({
                title: "Success! Your plant has been listed.",
                description: "It's now live for the community to see."
            });
            router.replace(`/plant/${plantId}`, { scroll: false });
        }

    }, [plantId, searchParams, router, toast]);

    const handleMessageSeller = async () => {
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

    const handleWishlistToggle = async () => {
        if (!user || !profile || !plant?.id) {
            toast({ variant: "destructive", title: "Please log in", description: "You need to be logged in to manage your wishlist." });
            return;
        }

        setIsWishlistLoading(true);
        try {
            if (isInWishlist) {
                await removePlantFromWishlist(user.uid, plant.id);
                toast({ title: "Removed from Wishlist", description: `${plant.name} has been removed from your wishlist.` });
            } else {
                await addPlantToWishlist(user.uid, plant.id);
                toast({ title: "Added to Wishlist!", description: `${plant.name} has been added to your wishlist.` });
            }
            await refreshUserProfile();
        } catch (error) {
            console.error("Wishlist error:", error);
            toast({ variant: "destructive", title: "Something went wrong", description: "Could not update your wishlist." });
        } finally {
            setIsWishlistLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!user || !profile || !plant?.ownerId || isOwner) {
            toast({ variant: "destructive", title: "Action not allowed." });
            return;
        }
    
        setIsFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(user.uid, plant.ownerId);
                toast({ title: "Unfollowed", description: `You are no longer following ${plant.ownerUsername}.` });
            } else {
                await followUser(user.uid, plant.ownerId);
                toast({ title: "Followed!", description: `You are now following ${plant.ownerUsername}.` });
            }
            await refreshUserProfile();
        } catch (error) {
            console.error("Follow/unfollow error:", error);
            toast({ variant: "destructive", title: "Something went wrong", description: "Could not update follow status." });
        } finally {
            setIsFollowLoading(false);
        }
    };

    async function handleDelete() {
        if (!isOwner || !plant) return;
        setIsDeleting(true);
        try {
            await deletePlantListing(plant);
            toast({
                title: "Listing Deleted",
                description: `${plant.name} has been successfully deleted.`,
            });
            router.push("/profile");
        } catch (error) {
            console.error("Failed to delete plant:", error);
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
            });
            setIsDeleting(false);
        }
    }

    const nextImage = () => {
        if (plant && plant.imageUrls.length > 1) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % plant.imageUrls.length);
        }
    };

    const prevImage = () => {
        if (plant && plant.imageUrls.length > 1) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + plant.imageUrls.length) % plant.imageUrls.length);
        }
    };

    if (isLoading) return <PlantDetailSkeleton />;
    if (error) return <div className="text-center py-10">{error}</div>;
    if (!plant) return <div className="text-center py-10">Plant not found.</div>;

    const isOwner = user?.uid === plant.ownerId;
    const isFollowing = profile?.following?.includes(plant.ownerId);
    const isInWishlist = profile?.favoritePlants?.includes(plant.id!);
    const isTradeOnly = plant.tradeOnly && (plant.price === undefined || plant.price === null);
    const isInCart = cartItems.some(item => item.id === plant.id);

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="grid md:grid-cols-2 gap-8 p-4 md:p-6 shadow-xl">
                {/* Image Gallery */}
                <div className="space-y-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                        <Image
                            src={plant.imageUrls[currentImageIndex] || "https://placehold.co/600x600.png"}
                            alt={plant.name}
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-300"
                            priority
                        />
                         {plant.imageUrls.length > 1 && (
                            <>
                                <Button size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white" onClick={prevImage}>
                                    <ChevronLeft />
                                </Button>
                                <Button size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white" onClick={nextImage}>
                                    <ChevronRight />
                                </Button>
                            </>
                        )}
                    </div>
                    {plant.imageUrls.length > 1 && (
                        <div className="grid grid-cols-5 gap-2">
                            {plant.imageUrls.map((url, index) => (
                                <button key={index} onClick={() => setCurrentImageIndex(index)} className={cn("aspect-square relative rounded-md overflow-hidden ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring", index === currentImageIndex && "ring-2 ring-primary")}>
                                    <Image src={url} alt={`${plant.name} thumbnail ${index + 1}`} layout="fill" objectFit="cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Plant Details */}
                <div className="flex flex-col space-y-4">
                    <CardTitle className="text-3xl lg:text-4xl font-bold text-primary">{plant.name}</CardTitle>
                    
                    {!isTradeOnly && (
                         <p className="text-3xl font-bold text-foreground">
                            {plant.price ? `$${plant.price.toFixed(2)}` : 'Free'}
                        </p>
                    )}
                   
                    <div className="flex flex-wrap gap-2">
                        {plant.tradeOnly && <Badge variant="secondary" className="text-sm">Trade Only</Badge>}
                        {plant.tags?.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                    </div>

                    <Separator />
                    
                    <CardDescription className="text-base text-muted-foreground flex-grow">{plant.description}</CardDescription>
                    
                    <Separator />

                    <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Listed {formatDistanceToNow((plant.listedDate as Timestamp).toDate(), { addSuffix: true })}</span>
                        </div>
                        {plant.location && (
                             <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{plant.location}</span>
                            </div>
                        )}
                    </div>
                     <Card className="bg-muted/50 p-3">
                        <div className="flex items-center justify-between space-x-3">
                            <Link href={`/profile/${plant.ownerId}`} className="flex items-center space-x-3 group/profile-link">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={plant.ownerAvatarUrl} alt={plant.ownerUsername} />
                                    <AvatarFallback><UserIcon /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm text-muted-foreground">Seller</p>
                                    <p className="font-semibold text-foreground group-hover/profile-link:underline">{plant.ownerUsername}</p>
                                </div>
                            </Link>
                            {!isOwner && user && (
                                <Button 
                                    variant={isFollowing ? "secondary" : "outline"} 
                                    size="sm"
                                    onClick={handleFollowToggle}
                                    disabled={authLoading || isFollowLoading}
                                >
                                    {isFollowLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : isFollowing ? (
                                        <UserCheck className="mr-2 h-4 w-4" />
                                    ) : (
                                        <UserPlus className="mr-2 h-4 w-4" />
                                    )}
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Button>
                            )}
                        </div>
                    </Card>

                    {isOwner && (
                         <div className="mt-auto pt-4 border-t">
                            <h3 className="text-base font-semibold text-foreground mb-2">Owner Actions</h3>
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline" className="w-full sm:w-auto">
                                    <Link href={`/plant/${plant.id}/edit`}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Listing
                                    </Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full sm:w-auto">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Listing
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your
                                                plant listing and remove all its images from our servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className={buttonVariants({ variant: "destructive" })}
                                            >
                                                {isDeleting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    "Yes, delete it"
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )}

                    {!isOwner && (
                        <div className="flex flex-col gap-2 pt-4 mt-auto">
                            {!isTradeOnly && (
                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={() => addToCart(plant)}
                                    disabled={!plant.isAvailable || isInCart}
                                >
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    {isInCart ? "In Cart" : "Add to Cart"}
                                </Button>
                            )}
                            <div className="flex w-full items-center gap-2">
                                <Button
                                    size="lg"
                                    className="w-full"
                                    variant={isTradeOnly ? "default" : "secondary"}
                                    onClick={handleMessageSeller}
                                    disabled={!plant.isAvailable || authLoading || isMessaging}
                                >
                                    {isMessaging ? (
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    ) : (
                                        <MessageSquare className="w-5 h-5 mr-2" />
                                    )}
                                    Message Seller
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="lg" 
                                    className="px-3 group/button"
                                    onClick={handleWishlistToggle}
                                    disabled={!plant.isAvailable || authLoading || isWishlistLoading}
                                    aria-label={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                                >
                                    {isWishlistLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Heart className={cn("w-5 h-5 transition-colors group-hover/button:fill-destructive group-hover/button:text-destructive", isInWishlist && "fill-destructive text-destructive")} />
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

function PlantDetailSkeleton() {
    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="grid md:grid-cols-2 gap-8 p-4 md:p-6">
                <div className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <div className="grid grid-cols-5 gap-2">
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                        <Skeleton className="aspect-square w-full rounded-md" />
                    </div>
                </div>
                <div className="flex flex-col space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-1/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Separator />
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-12" />
                             <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex-grow" />
                    <div className="flex flex-col gap-2 pt-2">
                        <Skeleton className="h-12 w-full" />
                        <div className="flex gap-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-14" />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

    