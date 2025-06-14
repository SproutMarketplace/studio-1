
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
import { Edit3, List, Mail, MapPin, MessageSquare, Repeat, Save, ShieldCheck, User, Construction, UploadCloud, Loader2 } from "lucide-react";
import { useAuth, type UserProfile } from "@/contexts/auth-context"; // Corrected import
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth as firebaseAuth } from "@/lib/firebase";
import { updateProfile as updateFirebaseAuthProfile } from "firebase/auth";
import Image from "next/image";

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).optional(),
  bio: z.string().max(500, { message: "Bio cannot exceed 500 characters." }).optional(),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, profile, loading: authLoading, refreshUserProfile, updateUserProfileInContext } = useAuth();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      location: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
      });
      if (profile.avatarUrl) {
        setImagePreview(profile.avatarUrl);
      }
    }
  }, [profile, form]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: "destructive", title: "Image too large", description: "Please select an image smaller than 2MB." });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "You must be logged in to update your profile." });
      return;
    }
    setIsSaving(true);
    let newAvatarUrl = profile?.avatarUrl || "";

    try {
      if (imageFile) {
        setIsUploading(true);
        const fStorage = getStorage();
        const fileRef = storageRef(fStorage, `profilePictures/${user.uid}/${imageFile.name}`);
        const snapshot = await uploadBytes(fileRef, imageFile);
        newAvatarUrl = await getDownloadURL(snapshot.ref);
        setIsUploading(false);
      }

      const userDocRef = doc(db, "users", user.uid);
      const updatedProfileData: Partial<UserProfile> = {
        name: data.name || profile?.name || user.displayName || "",
        bio: data.bio || profile?.bio || "",
        location: data.location || profile?.location || "",
        avatarUrl: newAvatarUrl,
        updatedAt: serverTimestamp(),
      };
      
      await updateDoc(userDocRef, updatedProfileData);

      // Update Firebase Auth profile as well
      if (firebaseAuth.currentUser) {
        await updateFirebaseAuthProfile(firebaseAuth.currentUser, {
          displayName: updatedProfileData.name,
          photoURL: newAvatarUrl,
        });
      }
      
      updateUserProfileInContext(updatedProfileData); 

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
      setImageFile(null); 
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your profile. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  const handleChangePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Password Change (Not Implemented)",
      description: "Password change functionality would be here.",
    });
  };

  const userListings = mockPlants.slice(0, 3);
  const userTrades = mockPlants.slice(3, 5);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Please log in to view your profile.</p>
        <Button onClick={() => window.location.href = '/login'} className="mt-4">Login</Button>
      </div>
    );
  }

  const displayName = profile?.name || user.displayName || "User";
  const displayEmail = profile?.email || user.email || "No email";
  const displayLocation = profile?.location || "Not set";

  return (
    <div className="container mx-auto py-8 space-y-8">
      <header className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative group">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary shadow-lg">
            <AvatarImage src={imagePreview || profile?.avatarUrl || "https://placehold.co/100x100.png"} alt={displayName} data-ai-hint="profile avatar" />
            <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatarUpload"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 rounded-full cursor-pointer"
          >
            <UploadCloud className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <input id="avatarUpload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold text-foreground">{displayName}</h1>
          <p className="text-lg text-muted-foreground flex items-center justify-center md:justify-start">
            <Mail className="w-4 h-4 mr-2" />{displayEmail}
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start">
            <MapPin className="w-4 h-4 mr-2" />{displayLocation}
          </p>
        </div>
      </header>

      <Separator />

      <Tabs defaultValue="settings" className="w-full">
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
              <CardDescription>Update your personal details. Email is managed by Firebase Auth.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">Full Name</Label>
                  <Input id="profileName" {...form.register("name")} />
                  {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileLocation">Location</Label>
                  <Input id="profileLocation" {...form.register("location")} placeholder="e.g., Greenville, USA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileBio">Bio</Label>
                  <Textarea id="profileBio" {...form.register("bio")} placeholder="Tell us about yourself and your plant interests..." className="min-h-[100px]" />
                  {form.formState.errors.bio && <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>}
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={isSaving || isUploading}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isUploading ? "Uploading Image..." : isSaving ? "Saving..." : "Save Changes"}
                </Button>
                {imageFile && <p className="text-xs text-muted-foreground">New image selected. Click "Save Changes" to upload.</p>}
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
                  <Input id="currentPassword" name="currentPassword" type="password" placeholder="••••••••" disabled/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" name="newPassword" type="password" placeholder="••••••••" disabled/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" disabled/>
                </div>
                <Button type="submit" variant="outline" className="w-full md:w-auto" disabled>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Change Password (Not Implemented)
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
