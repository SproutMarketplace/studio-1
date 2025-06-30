
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, UserPlus, MessagesSquare, Loader2, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { getForumById, getPostsForForum, addForumPost, updateForumPost, uploadPostImage } from "@/lib/firestoreService";
import type { Forum, Post } from "@/models";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Timestamp } from "firebase/firestore";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
  content: z.string().min(10, "Post content must be at least 10 characters long."),
});

type PostFormValues = z.infer<typeof postSchema>;

const MAX_IMAGES = 3;

export default function CommunityPage() {
    const params = useParams();
    const { toast } = useToast();
    const communityId = params.communityId as string;
    const { user, profile } = useAuth();

    const [community, setCommunity] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: { title: "", content: "" },
    });

    useEffect(() => {
        if (!communityId) return;

        const fetchCommunityData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [forumData, postsData] = await Promise.all([
                    getForumById(communityId),
                    getPostsForForum(communityId),
                ]);

                if (!forumData) {
                    setError("Community not found.");
                    toast({ variant: "destructive", title: "Error", description: "This community does not exist." });
                } else {
                    setCommunity(forumData);
                    setPosts(postsData);
                }
            } catch (err) {
                console.error("Error fetching community data:", err);
                setError("Failed to load community. Please try again later.");
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch community data.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommunityData();
    }, [communityId, toast]);

    const handleJoinCommunity = () => {
        toast({
            title: "Joined Community (Simulated)",
            description: `You've joined the ${community?.name || 'community'}! (This is a simulation)`,
        });
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const remainingSlots = MAX_IMAGES - imageFiles.length;
            if (files.length > remainingSlots) {
                toast({
                    variant: "destructive",
                    title: "Too many images",
                    description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
                });
            }
            const newFiles = files.slice(0, remainingSlots);

            setImageFiles(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);

            event.target.value = "";
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const newPreviews = [...prev];
            const removedPreview = newPreviews.splice(index, 1);
            if (removedPreview[0]) {
                URL.revokeObjectURL(removedPreview[0]);
            }
            return newPreviews;
        });
    };

    const handleCreatePostSubmit = async (data: PostFormValues) => {
        if (!user || !profile || !communityId) {
            toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to create a post." });
            return;
        }
        
        form.clearErrors();
        let postId = "";

        try {
            // 1. Create the post document to get an ID
            postId = await addForumPost(communityId, {
                forumId: communityId,
                title: data.title,
                content: data.content,
                authorId: user.uid,
                authorUsername: profile.username,
                authorAvatarUrl: profile.avatarUrl || "",
                imageUrls: [], // Start with empty array
            });

            // 2. Upload images if they exist
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                imageUrls = await Promise.all(
                    imageFiles.map((file, index) => uploadPostImage(communityId, postId, file, index))
                );
                // 3. Update the post document with the image URLs
                await updateForumPost(communityId, postId, { imageUrls });
            }

            // 4. Optimistically update the UI
            const newPostForState: Post = {
                id: postId,
                forumId: communityId,
                title: data.title,
                content: data.content,
                authorId: user.uid,
                authorUsername: profile.username,
                authorAvatarUrl: profile.avatarUrl || "",
                createdAt: new Date() as unknown as Timestamp, // Visually correct, server has true value
                upvotes: [],
                downvotes: [],
                commentCount: 0,
                imageUrls: imageUrls,
            };
            
            setPosts(prevPosts => [newPostForState, ...prevPosts]);

            toast({
                title: "Post Created!",
                description: "Your post is now live in the community.",
            });

            // 5. Reset form and close dialog
            form.reset();
            setImageFiles([]);
            setImagePreviews([]);
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error creating post:", error);
            toast({
                variant: "destructive",
                title: "Failed to create post",
                description: "There was an error submitting your post. Please try again.",
            });
        }
    };


    if (isLoading) {
         return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error && !community) {
        return (
            <div className="container mx-auto py-8 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>{error}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The community you are looking for does not exist or could not be loaded.</p>
                        <Button asChild className="mt-4">
                            <Link href="/forums">Back to Communities</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!community) {
         return (
            <div className="container mx-auto py-8 text-center">
                 <Card>
                    <CardHeader>
                        <CardTitle>Community Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>The community could not be loaded.</p>
                        <Button asChild className="mt-4">
                            <Link href="/forums">Back to Communities</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <Card className="w-full shadow-xl mb-6">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold text-primary">{community.name}</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">{community.description}</CardDescription>
                        </div>
                        <Button onClick={handleJoinCommunity} className="text-base py-2 h-auto shrink-0">
                            <UserPlus className="mr-2 h-5 w-5" />
                            Join Community
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div className="mb-6 flex justify-end">
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="text-base" disabled={!user}>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create Post
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create a new post in {community.name}</DialogTitle>
                            <DialogDescription>
                                Share your thoughts, questions, or plants with the community.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreatePostSubmit)} className="space-y-4 py-2">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Post Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Is my Monstera healthy?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content</FormLabel>
                                            <FormControl>
                                                <Textarea rows={5} placeholder="Add more details here..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <FormLabel>Images (Optional)</FormLabel>
                                    <div className="p-4 border-2 border-dashed rounded-lg border-border bg-muted/50">
                                        {imagePreviews.length > 0 && (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                                                {imagePreviews.map((src, index) => (
                                                    <div key={index} className="relative aspect-square">
                                                        <Image src={src} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={() => removeImage(index)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {imageFiles.length < MAX_IMAGES && (
                                            <label htmlFor="image-upload" className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/80">
                                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                                <p className="text-xs text-muted-foreground">Up to {MAX_IMAGES} images</p>
                                                <Input id="image-upload" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} disabled={imageFiles.length >= MAX_IMAGES} />
                                            </label>
                                        )}
                                    </div>
                                </FormItem>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button type="button" variant="ghost">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...
                                            </>
                                        ) : "Create Post"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => (
                        <Card key={post.id} className="shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-xl hover:text-primary">
                                    {post.title}
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Posted by {post.authorUsername} &bull; {post.commentCount} replies
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm line-clamp-3">{post.content}</p>
                                {post.imageUrls && post.imageUrls.length > 0 && (
                                    <div className="mt-4">
                                        <Image
                                            src={post.imageUrls[0]}
                                            alt={`Image for post: ${post.title}`}
                                            width={500}
                                            height={300}
                                            className="rounded-lg object-cover"
                                        />
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" size="sm" className="hover:bg-muted hover:text-muted-foreground" disabled>View Post (soon)</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                        <MessagesSquare className="w-16 h-16 mb-4 text-muted-foreground" />
                        <p className="text-xl font-semibold text-foreground">No Posts Yet</p>
                        <p className="text-muted-foreground">
                            Be the first to share something in this community!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
