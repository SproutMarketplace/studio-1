
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserPlantListings, getWishlistPlants, uploadProfileImage, updateUserData, getUserProfile, followUser, unfollowUser } from "@/lib/firestoreService";
import type { PlantListing, User } from "@/models";
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User as UserIcon, Calendar, Leaf, Heart, Settings, Camera, LayoutDashboard, UserPlus, UserCheck } from "lucide-react";
import { PlantCard } from "@/components/plant-card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EditProfileForm } from "@/components/edit-profile-form";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const { user: loggedInUser, profile: loggedInUserProfile, loading: authLoading, updateUserProfileInContext, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [viewedProfile, setViewedProfile] = useState<User | null>(null);
  const [userPlants, setUserPlants] = useState<PlantListing[]>([]);
  const [wishlistPlants, setWishlistPlants] = useState<PlantListing[]>([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = loggedInUser?.uid === userId;
  const isFollowing = loggedInUserProfile?.following?.includes(userId);


  useEffect(() => {
    if (!userId) return;

    const fetchPageData = async () => {
        setPageLoading(true);
        try {
            const profileData = await getUserProfile(userId);
            if (!profileData) {
                router.push('/catalog'); // or a 404 page
                toast({ variant: 'destructive', title: 'User not found' });
                return;
            }
            setViewedProfile(profileData);

            // If we are viewing our own profile, ensure we use the live data from context
            if (loggedInUser?.uid === userId) {
                setViewedProfile(loggedInUserProfile);
            }
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load profile.' });
        } finally {
            setPageLoading(false);
        }
    };

    fetchPageData();
  }, [userId, loggedInUser?.uid, loggedInUserProfile, router, toast]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserPlants = async () => {
      setListingsLoading(true);
      try {
        const plants = await getUserPlantListings(userId);
        setUserPlants(plants);
      } catch (error) {
        console.error("Failed to fetch user plants:", error);
      } finally {
        setListingsLoading(false);
      }
    };
    fetchUserPlants();

    if (isOwner) {
        const fetchWishlist = async () => {
            setWishlistLoading(true);
            try {
                const plants = await getWishlistPlants(userId);
                setWishlistPlants(plants);
            } catch (error) {
                console.error("Failed to fetch wishlist:", error);
            } finally {
                setWishlistLoading(false);
            }
        };
        fetchWishlist();
    }
  }, [userId, isOwner, loggedInUserProfile?.favoritePlants]);


  const handleAvatarClick = () => {
    if (isOwner && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !loggedInUser || !isOwner) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Please upload an image smaller than 2MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const newAvatarUrl = await uploadProfileImage(loggedInUser.uid, file);
      await updateUserData(loggedInUser.uid, { avatarUrl: newAvatarUrl });
      updateUserProfileInContext({ avatarUrl: newAvatarUrl });

      toast({
        title: "Profile picture updated!",
        description: "Your new picture is now live.",
      });
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was an error updating your profile picture.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!loggedInUser || !loggedInUserProfile || !userId || isOwner) {
        toast({ variant: "destructive", title: "Action not allowed." });
        return;
    }

    setIsFollowLoading(true);
    try {
        if (isFollowing) {
            await unfollowUser(loggedInUser.uid, userId);
            toast({ title: "Unfollowed", description: `You are no longer following ${viewedProfile?.username}.` });
        } else {
            await followUser(loggedInUser.uid, userId);
            toast({ title: "Followed!", description: `You are now following ${viewedProfile?.username}.` });
        }
        await refreshUserProfile();
    } catch (error) {
        console.error("Follow/unfollow error:", error);
        toast({ variant: "destructive", title: "Something went wrong", description: "Could not update follow status." });
    } finally {
        setIsFollowLoading(false);
    }
  };


  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!viewedProfile) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This profile could not be found.</p>
            <Button asChild className="mt-4">
              <Link href="/catalog">Go to Catalog</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinedDate = viewedProfile.joinedDate ? format((viewedProfile.joinedDate as Timestamp).toDate(), 'MMMM yyyy') : 'N/A';

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar
              className={cn("h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20", isOwner && "cursor-pointer")}
              onClick={handleAvatarClick}
            >
              <AvatarImage src={viewedProfile.avatarUrl} alt={viewedProfile.username} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                <UserIcon className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <div
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 mx-auto" />
                    <span className="text-xs font-semibold">Change</span>
                  </div>
                )}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/png, image/jpeg, image/gif"
              disabled={isUploading || !isOwner}
            />
          </div>
          <div className="flex-1 text-center sm:text-left">
             <div className="flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-start">
              <h1 className="text-3xl font-bold text-primary">{viewedProfile.username}</h1>
              {!isOwner && loggedInUser && (
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
            <p className="text-muted-foreground">{viewedProfile.email}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 justify-center sm:justify-start">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinedDate}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                    <span className="font-bold text-foreground">{viewedProfile.following?.length || 0}</span> Following
                </div>
                <div className="flex items-center gap-1">
                    <span className="font-bold text-foreground">{viewedProfile.followers?.length || 0}</span> Followers
                </div>
            </div>
            {viewedProfile.bio && <p className="mt-2 text-sm">{viewedProfile.bio}</p>}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className={cn("grid w-full", isOwner ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1")}>
          <TabsTrigger value="listings"><Leaf className="mr-2 h-4 w-4" />Listings</TabsTrigger>
          {isOwner && <TabsTrigger value="wishlist"><Heart className="mr-2 h-4 w-4" />Wishlist</TabsTrigger>}
          {isOwner && <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Edit Profile</TabsTrigger>}
          {isOwner && <TabsTrigger value="seller-dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Seller Tools</TabsTrigger>}
        </TabsList>
        <TabsContent value="listings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{isOwner ? "My Plant Listings" : `${viewedProfile.username}'s Listings`}</CardTitle>
              <CardDescription>{isOwner ? "The plants you have listed for sale or trade." : `Plants listed by ${viewedProfile.username}.`}</CardDescription>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              ) : userPlants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userPlants.map(plant => (
                    <PlantCard key={plant.id} plant={plant} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold">{isOwner ? "You haven't listed any plants yet." : "This user hasn't listed any plants yet."}</h3>
                  {isOwner && <Button asChild className="mt-4"><Link href="/list-plant">List a Plant</Link></Button>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {isOwner && (
            <>
                <TabsContent value="wishlist" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Wishlist</CardTitle>
                            <CardDescription>The plants you've saved for future consideration.</CardDescription>
                        </CardHeader>
                        <CardContent>
                        {wishlistLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                        ) : wishlistPlants.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {wishlistPlants.map(plant => (
                            <PlantCard key={plant.id} plant={plant} />
                            ))}
                        </div>
                        ) : (
                        <div className="text-center py-12">
                            <h3 className="text-xl font-semibold">Your wishlist is empty.</h3>
                            <p className="text-muted-foreground mt-2">Browse the catalog to find plants to add.</p>
                            <Button asChild className="mt-4">
                            <Link href="/catalog">Find Plants</Link>
                            </Button>
                        </div>
                        )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="settings" className="mt-6">
                    <EditProfileForm />
                </TabsContent>
                <TabsContent value="seller-dashboard" className="mt-6">
                    <Card>
                        <CardHeader>
                        <CardTitle>Seller Dashboard</CardTitle>
                        <CardDescription>
                            Access tools and insights to grow your plant business.
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Manage your orders, view sales statistics, and track your finances all in one place.
                        </p>
                        <Button asChild>
                            <Link href="/seller/dashboard">
                            Go to Seller Dashboard
                            </Link>
                        </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </>
        )}
      </Tabs>
    </div>
  );
}

    