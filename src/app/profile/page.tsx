
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserPlantListings } from "@/lib/firestoreService";
import type { PlantListing } from "@/models";
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User as UserIcon, Calendar, Leaf, Heart, Settings } from "lucide-react";
import { PlantCard } from "@/components/plant-card";

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [userPlants, setUserPlants] = useState<PlantListing[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const fetchUserPlants = async () => {
        setPlantsLoading(true);
        try {
          const plants = await getUserPlantListings(user.uid);
          setUserPlants(plants);
        } catch (error) {
          console.error("Failed to fetch user plants:", error);
          // Handle error, maybe show a toast
        } finally {
          setPlantsLoading(false);
        }
      };
      fetchUserPlants();
    }
  }, [user?.uid]);

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

  // Safely format date
  const joinedDate = profile.joinedDate ? format((profile.joinedDate as Timestamp).toDate(), 'MMMM yyyy') : 'N/A';

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-primary/20">
            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <UserIcon className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-primary">{profile.username}</h1>
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
          <TabsTrigger value="wishlist" disabled><Heart className="mr-2 h-4 w-4" />Wishlist</TabsTrigger>
          <TabsTrigger value="settings" disabled><Settings className="mr-2 h-4 w-4" />Edit Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Plant Listings</CardTitle>
              <CardDescription>The plants you have listed for sale or trade.</CardDescription>
            </CardHeader>
            <CardContent>
              {plantsLoading ? (
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
        <TabsContent value="wishlist">
           {/* Wishlist content will go here */}
           <Card><CardContent className="p-6 text-center text-muted-foreground">Wishlist functionality is coming soon!</CardContent></Card>
        </TabsContent>
        <TabsContent value="settings">
          {/* Edit profile form will go here */}
          <Card><CardContent className="p-6 text-center text-muted-foreground">Profile editing is coming soon!</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
