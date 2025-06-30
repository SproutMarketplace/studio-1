
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserPlantListings, getWishlistPlants, uploadProfileImage, updateUserData } from "@/lib/firestoreService";
import type { PlantListing } from "@/models";
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User as UserIcon, Calendar, Leaf, Heart, Settings, Camera } from "lucide-react";
import { PlantCard } from "@/components/plant-card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EditProfileForm } from "@/components/edit-profile-form";

export default function ProfilePage() {
  const { user, profile, loading: authLoading, updateUserProfileInContext } = useAuth();
  const [userPlants, setUserPlants] = useState<PlantListing[]>([]);
  const [wishlistPlants, setWishlistPlants] = useState<PlantListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user?.uid) {
      const fetchUserPlants = async () => {
        setListingsLoading(true);
        try {
          const plants = await getUserPlantListings(user.uid);
          setUserPlants(plants);
        } catch (error) {
          console.error("Failed to fetch user plants:", error);
        } finally {
          setListingsLoading(false);
        }
      };
      fetchUserPlants();
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      const fetchWishlist = async () => {
        setWishlistLoading(true);
        try {
          const plants = await getWishlistPlants(user.uid);
          setWishlistPlants(plants);
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
        } finally {
          setWishlistLoading(false);
        }
      };
      fetchWishlist();
    }
  }, [user?.uid, profile?.favoritePlants]);

  const handleAvatarClick = () => {
    if (user?.uid === profile?.userId && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !profile) return;

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
      const newAvatarUrl = await uploadProfileImage(user.uid, file);
      await updateUserData(user.uid, { avatarUrl: newAvatarUrl });
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

  if (authLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to view your profile.</p>
            <Button asChild className="mt-4">
              <Link href="/login">Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinedDate = profile.joinedDate ? format((profile.joinedDate as Timestamp).toDate(), 'MMMM yyyy') : 'N/A';
  const isOwner = user?.uid === profile.userId;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar
              className={cn("h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20", isOwner && "cursor-pointer")}
              onClick={handleAvatarClick}
            >
              <AvatarImage src={profile.avatarUrl} alt={profile.username} />
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
              disabled={isUploading}
            />
          </div>
          <div className="text-center sm:text-left">
             <div className="flex items-center gap-3 justify-center sm:justify-start">
              <h1 className="text-3xl font-bold text-primary">{profile.username}</h1>
            </div>
            <p className="text-muted-foreground">{profile.email}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 justify-center sm:justify-start">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinedDate}</span>
            </div>
            {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listings"><Leaf className="mr-2 h-4 w-4" />My Listings</TabsTrigger>
          <TabsTrigger value="wishlist"><Heart className="mr-2 h-4 w-4" />Wishlist</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-2 h-4 w-4" />Edit Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Plant Listings</CardTitle>
              <CardDescription>The plants you have listed for sale or trade.</CardDescription>
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
                  <h3 className="text-xl font-semibold">You haven't listed any plants yet.</h3>
                  <Button asChild className="mt-4">
                    <Link href="/list-plant">List a Plant</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
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
      </Tabs>
    </div>
  );
}
