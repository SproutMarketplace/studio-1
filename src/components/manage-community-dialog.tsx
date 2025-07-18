
"use client";

import { useState, useEffect, ChangeEvent, useRef } from "react";
import Image from "next/image";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { Forum, User } from "@/models";
import { updateForum, uploadForumBanner, deleteForumBanner, addModeratorToForum, removeModeratorFromForum, getUserByUsername, getUserProfile, deleteForum } from "@/lib/firestoreService";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UploadCloud, X, Trash2, UserPlus, Search as SearchIcon, ShieldCheck, ShieldX } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";


const forumSettingsSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(50),
  description: z.string().min(10, "Description must be at least 10 characters.").max(200),
});

type ForumSettingsFormValues = z.infer<typeof forumSettingsSchema>;

interface ManageCommunityDialogProps {
  forum: Forum;
  children: React.ReactNode;
  onUpdate: (updatedForum: Forum) => void;
  onDelete: () => void;
}

export function ManageCommunityDialog({ forum, children, onUpdate, onDelete }: ManageCommunityDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    
    // State for General Settings
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(forum.bannerUrl || null);
    
    // State for Moderator Management
    const [moderators, setModerators] = useState<User[]>([]);
    const [modsLoading, setModsLoading] = useState(true);
    const [searchUsername, setSearchUsername] = useState("");
    const [searchResult, setSearchResult] = useState<User | null | "not_found">(null);
    const [isSearching, setIsSearching] = useState(false);

    // State for Deletion
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<ForumSettingsFormValues>({
        resolver: zodResolver(forumSettingsSchema),
        defaultValues: {
          name: forum.name,
          description: forum.description,
        },
    });

    useEffect(() => {
        if (open) {
            // Reset state when dialog opens
            form.reset({ name: forum.name, description: forum.description });
            setBannerPreview(forum.bannerUrl || null);
            setBannerFile(null);
            
            // Fetch moderators
            const fetchModerators = async () => {
                if (!forum.moderatorIds || forum.moderatorIds.length === 0) {
                    setModerators([]);
                    setModsLoading(false);
                    return;
                }
                setModsLoading(true);
                try {
                    const modProfiles = await Promise.all(
                        forum.moderatorIds.map(id => getUserProfile(id))
                    );
                    setModerators(modProfiles.filter(p => p !== null) as User[]);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Could not load moderators.' });
                } finally {
                    setModsLoading(false);
                }
            };
            fetchModerators();
        }
    }, [open, forum, form, toast]);


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          if (file.size > 4 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Image too large (max 4MB)" });
            return;
          }
          setBannerFile(file);
          setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleSearchUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchUsername.trim()) return;

        setIsSearching(true);
        setSearchResult(null);
        try {
            const user = await getUserByUsername(searchUsername.trim());
            setSearchResult(user || "not_found");
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error searching for user.' });
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddModerator = async (user: User) => {
        try {
            await addModeratorToForum(forum.id!, user.userId);
            setModerators(prev => [...prev, user]);
            onUpdate({ ...forum, moderatorIds: [...(forum.moderatorIds || []), user.userId] });
            toast({ title: 'Moderator Added', description: `${user.username} is now a moderator.` });
            setSearchResult(null);
            setSearchUsername("");
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to add moderator.' });
        }
    };

    const handleRemoveModerator = async (user: User) => {
        try {
            await removeModeratorFromForum(forum.id!, user.userId);
            setModerators(prev => prev.filter(mod => mod.userId !== user.userId));
            onUpdate({ ...forum, moderatorIds: (forum.moderatorIds || []).filter(id => id !== user.userId) });
            toast({ title: 'Moderator Removed', description: `${user.username} is no longer a moderator.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to remove moderator.' });
        }
    };

    const handleSettingsSubmit = async (data: ForumSettingsFormValues) => {
        setIsSubmitting(true);
        try {
            let bannerUrl = forum.bannerUrl;
            
            if (bannerFile) {
                // If there's an old banner, delete it first
                if (forum.bannerUrl) {
                    await deleteForumBanner(forum.bannerUrl);
                }
                bannerUrl = await uploadForumBanner(forum.id!, bannerFile);
            }
            
            const updatedData: Partial<Forum> = {
                name: data.name,
                description: data.description,
                bannerUrl: bannerUrl || '',
            };

            await updateForum(forum.id!, updatedData);
            
            onUpdate({ ...forum, ...updatedData });
            toast({ title: "Community updated successfully!" });
            setOpen(false);

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: "Failed to update community." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteCommunity = async () => {
        setIsDeleting(true);
        try {
            await deleteForum(forum.id!, forum.bannerUrl);
            toast({ title: 'Community Deleted', description: `The ${forum.name} community has been permanently deleted.`});
            onDelete();
            setOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete the community.' });
        } finally {
            setIsDeleting(false);
        }
    }


    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage: {forum.name}</DialogTitle>
          <DialogDescription>
            Update your community's settings, manage moderators, and more.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="moderators">Moderators</TabsTrigger>
                <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="py-4">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSettingsSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Community Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Community Banner</FormLabel>
                            <FormControl>
                                <label
                                htmlFor="banner-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary bg-muted/50 hover:bg-muted"
                                >
                                {bannerPreview ? (
                                    <div className="relative w-full h-full">
                                    <Image src={bannerPreview} alt="Banner preview" layout="fill" objectFit="cover" className="rounded-md" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                    </div>
                                )}
                                <Input
                                    id="banner-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                </label>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                         <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="moderators" className="py-4 space-y-6">
                <div>
                    <h4 className="font-medium mb-2">Add Moderator</h4>
                    <form onSubmit={handleSearchUser} className="flex gap-2">
                        <Input 
                            placeholder="Enter username to add..."
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                        />
                        <Button type="submit" variant="outline" size="icon" disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
                        </Button>
                    </form>
                    {searchResult && (
                        <div className="mt-4 p-3 border rounded-md">
                            {searchResult === 'not_found' ? (
                                <p className="text-sm text-muted-foreground">User not found.</p>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8"><AvatarImage src={searchResult.avatarUrl}/><AvatarFallback>{searchResult.username.charAt(0)}</AvatarFallback></Avatar>
                                        <span className="text-sm font-medium">{searchResult.username}</span>
                                    </div>
                                    <Button size="sm" onClick={() => handleAddModerator(searchResult)} disabled={forum.creatorId === searchResult.userId || moderators.some(m => m.userId === searchResult.userId)}>
                                        <UserPlus className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <Separator />
                <div>
                     <h4 className="font-medium mb-2">Current Moderators</h4>
                     <div className="space-y-2">
                         {modsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 
                            moderators.length > 0 ? (
                                moderators.map(mod => (
                                    <div key={mod.userId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8"><AvatarImage src={mod.avatarUrl}/><AvatarFallback>{mod.username.charAt(0)}</AvatarFallback></Avatar>
                                            <span className="text-sm font-medium">{mod.username}</span>
                                            <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3"/>Moderator</Badge>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveModerator(mod)}>
                                            <ShieldX className="mr-2 h-4 w-4"/> Remove
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No moderators yet.</p>
                            )
                         }
                     </div>
                </div>
            </TabsContent>

            <TabsContent value="danger" className="py-4">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">Delete Community</CardTitle>
                        <CardDescription>
                            This action is permanent and cannot be undone. This will delete the community, but all posts and comments will remain.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete this community
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the "{forum.name}" community. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteCommunity} disabled={isDeleting} className={cn(isDeleting && "bg-destructive/80")}>
                                       {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                       {isDeleting ? 'Deleting...' : 'Yes, delete it'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    )

    