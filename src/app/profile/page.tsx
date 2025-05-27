
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { mockPlants } from "@/lib/plant-data";
import { PlantCard } from "@/components/plant-card";
import { Edit3, List, Mail, MapPin, MessageSquare, Repeat, Save, ShieldCheck, User, Construction } from "lucide-react";
import Image from "next/image";

// Mock user data - in a real app, this would come from your auth context/API
const mockUser = {
  name: "Flora Enthusiast",
  email: "flora.enthusiast@example.com",
  avatarUrl: "https://placehold.co/100x100.png",
  bio: "Passionate plant parent, always looking to trade and share green joy! Collector of rare aroids and hoyas.",
  location: "Greenville, USA"
};

export default function ProfilePage() {
  const { toast } = useToast();

  // Mock data for listings and trades
  const userListings = mockPlants.slice(0, 3); // Example: first 3 plants
  const userTrades = mockPlants.slice(3, 5);   // Example: next 2 plants

  const handleProfileUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Profile updated:", data);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
  };
  
  const handleChangePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    console.log("Password change requested:", data);
    if (data.newPassword !== data.confirmPassword) {
        toast({
            variant: "destructive",
            title: "Password Mismatch",
            description: "New password and confirm password do not match.",
        });
        return;
    }
    toast({
      title: "Password Change",
      description: "Password change request processed (check console).",
    });
    (event.target as HTMLFormElement).reset();
  };


  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary shadow-lg">
          <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} data-ai-hint="profile avatar" />
          <AvatarFallback>{mockUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold text-foreground">{mockUser.name}</h1>
          <p className="text-lg text-muted-foreground flex items-center justify-center md:justify-start">
            <Mail className="w-4 h-4 mr-2" />{mockUser.email}
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start">
            <MapPin className="w-4 h-4 mr-2" />{mockUser.location}
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
          </Button>
        </div>
      </header>

      <Separator />

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="listings"><List className="w-4 h-4 mr-2" />My Listings</TabsTrigger>
          <TabsTrigger value="trades"><Repeat className="w-4 h-4 mr-2" />My Trades</TabsTrigger>
          <TabsTrigger value="messages"><MessageSquare className="w-4 h-4 mr-2" />Messages</TabsTrigger>
          <TabsTrigger value="settings"><User className="w-4 h-4 mr-2" />Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Plant Listings</CardTitle>
              <CardDescription>Plants you are currently offering for sale or trade.</CardDescription>
            </CardHeader>
            <CardContent>
              {userListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userListings.map((plant) => (
                    <PlantCard key={plant.id} plant={plant} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">You have no active listings.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">My Trade History</CardTitle>
              <CardDescription>Completed or ongoing trades.</CardDescription>
            </CardHeader>
            <CardContent>
              {userTrades.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTrades.map((plant) => (
                    <PlantCard key={plant.id} plant={plant} />
                  ))}
                </div>
              ) : (
                 <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                    <Construction className="w-16 h-16 mb-4 text-muted-foreground" />
                    <p className="text-xl font-semibold text-foreground">No Trades Yet</p>
                    <p className="text-muted-foreground">
                      Start listing or browsing to make your first trade!
                    </p>
                  </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Messages</CardTitle>
              <CardDescription>Your conversations with other Sprout users.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                <Construction className="w-16 h-16 mb-4 text-muted-foreground" />
                <p className="text-xl font-semibold text-foreground">Messaging Feature Coming Soon</p>
                <p className="text-muted-foreground">
                  We're working on a way for you to connect directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Edit Profile Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Full Name</Label>
                  <Input id="profileName" name="name" defaultValue={mockUser.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">Email Address</Label>
                  <Input id="profileEmail" name="email" type="email" defaultValue={mockUser.email} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="profileLocation">Location</Label>
                  <Input id="profileLocation" name="location" defaultValue={mockUser.location} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileBio">Bio</Label>
                  <Textarea id="profileBio" name="bio" defaultValue={mockUser.bio} placeholder="Tell us about yourself and your plant interests..." className="min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Security</CardTitle>
              <CardDescription>Manage your account security settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" name="currentPassword" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" name="newPassword" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" />
                </div>
                <Button type="submit" variant="outline" className="w-full md:w-auto">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
