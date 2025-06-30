
"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { updateUserData, uploadProfileImage } from "@/lib/firestoreService";
import type { User } from "@/models";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User as UserIcon, Camera } from "lucide-react";

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters.").max(30, "Username cannot exceed 30 characters."),
  bio: z.string().max(160, "Bio cannot exceed 160 characters.").optional().default(""),
  location: z.string().max(50, "Location cannot exceed 50 characters.").optional().default(""),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function EditProfileForm() {
    const { user, profile, updateUserProfileInContext } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: profile?.username || "",
            bio: profile?.bio || "",
            location: profile?.location || "",
        },
    });

    const handleAvatarClick = () => {
        if (!isUploading) {
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


    async function onSubmit(data: ProfileFormValues) {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const updates: Partial<User> = {};
            if (data.username !== profile?.username) updates.username = data.username;
            if (data.bio !== profile?.bio) updates.bio = data.bio;
            if (data.location !== profile?.location) updates.location = data.location;
            
            if (Object.keys(updates).length > 0) {
                 await updateUserData(user.uid, updates);
                 updateUserProfileInContext(updates);
                 toast({
                    title: "Profile updated successfully!",
                 });
            } else {
                 toast({
                    title: "No changes to save.",
                 });
            }
           
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Update failed",
                description: "There was an error updating your profile.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!profile) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center gap-4">
                     <div className="relative group">
                        <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
                            <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={handleAvatarClick}>
                            {isUploading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Camera className="w-6 h-6" />
                            )}
                        </div>
                     </div>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg"
                        disabled={isUploading}
                    />
                    <Button variant="outline" onClick={handleAvatarClick} disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Change Picture"}
                    </Button>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your username" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tell us a little about yourself" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., San Francisco, CA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
