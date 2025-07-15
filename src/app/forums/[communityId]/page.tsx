
"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, UserPlus, MessagesSquare, Loader2, UploadCloud, X, ChevronLeft, ChevronRight, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { getForumById, getPostsForForum, addForumPost, updateForumPost, uploadPostImage, deleteForumPost } from "@/lib/firestoreService";
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
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
  content: z.string().min(10, "Post content must be at least 10 characters long."),
});

type PostFormValues = z.infer<typeof postSchema>;

const MAX_IMAGES = 3;

function PostCard({ 
    post, 
    isOwner, 
    onEdit,
    onDeleteInitiate
}: { 
    post: Post; 
    isOwner: boolean; 
    onEdit: (post: Post) => void;
    onDeleteInitiate: (post: Post) => void;
}) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentImageIndex(prev => (prev - 1 + (post.imageUrls?.length || 1)) % (post.imageUrls?.length || 1));
    }
    
    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentImageIndex(prev => (prev + 1) % (post.imageUrls?.length || 1));
    }

    const hasImages = post.imageUrls && post.imageUrls.length > 0;
    const postLink = `/forums/${post.forumId}/${post.id}`;

    const getFormattedDate = (date: Post['createdAt']) => {
        if (!date) return '';
        
        let dateToFormat: Date;
        // Check if it's a Firebase Timestamp by looking for the toDate method
        if (date && typeof (date as Timestamp).toDate === 'function') {
            dateToFormat = (date as Timestamp).toDate();
        } else {
            // It's already a JavaScript Date
            dateToFormat = date as Date;
        }

        return formatDistanceToNow(dateToFormat, { addSuffix: true });
    };

    return (
        <Card className="shadow-md hover:shadow-lg transition-shadow group flex flex-col relative">
            {isOwner && (
                <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/30 text-white hover:bg-black/50 hover:text-white">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(post)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteInitiate(post)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
            {hasImages && (
                <CardHeader className="p-0">
                    <div className="relative w-full h-56 group/image">
                         <Link href={postLink}>
                            <Image
                                src={post.imageUrls![currentImageIndex]}
                                alt={`Image for post: ${post.title}`}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-300 group-hover:scale-105"
                            />
                        </Link>
                         {post.imageUrls!.length > 1 && (
                            <>
                                <Button size="icon" variant="ghost" onClick={handlePrevImage} className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/50 hover:text-white">
                                    <ChevronLeft className="h-5 w-5"/>
                                </Button>
                                <Button size="icon" variant="ghost" onClick={handleNextImage} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/50 hover:text-white">
                                    <ChevronRight className="h-5 w-5"/>
                                </Button>
                            </>
                        )}
                    </div>
                </CardHeader>
            )}
            <CardContent className={cn("p-4 flex-grow", !hasImages && "pt-6")}>
                <CardTitle className="text-xl hover:text-primary transition-colors">
                    <Link href={postLink} className="hover:underline">
                        {post.title}
                    </Link>
                </CardTitle>
                 <CardDescription className="text-xs text-muted-foreground mt-1">
                    Posted by {post.authorUsername} &bull; {getFormattedDate(post.createdAt)}
                </CardDescription>
                <p className="text-sm line-clamp-2 mt-2">{post.content}</p>
            </CardContent>
            <CardFooter className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4"/>
                    {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                </div>
                 <Button asChild variant="outline" size="sm">
                    <Link href={postLink}>View Post</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}


export default function CommunityPage() {
    const params = useParams();
    const { toast } = useToast();
    const communityId = params.communityId as string;
    const { user, profile, loading: authLoading } = useAuth();

    const [community, setCommunity] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Edit/Delete states
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const form = useForm<PostFormValues>({
        resolver: zodResolver(postSchema),
        defaultValues: { title: "", content: "" },
    });
    
    // When dialog opens for editing
    useEffect(() => {
        if (editingPost) {
            form.reset({
                title: editingPost.title,
                content: editingPost.content,
            });
            // We don't handle image editing in this flow for simplicity
            setImageFiles([]);
            setImagePreviews([]);
        } else {
            // Reset for new post
            form.reset({ title: "", content: "" });
            setImageFiles([]);
            setImagePreviews([]);
        }
    }, [editingPost, form]);


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

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
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
    
    const handleEditPost = (post: Post) => {
        setEditingPost(post);
        setIsDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setEditingPost(null); // Clear editing state on close
    };
    
    const handleDeleteInitiate = (post: Post) => {
        setPostToDelete(post);
        setIsDeleteAlertOpen(true);
    };

    const confirmDeletePost = async () => {
        if (!postToDelete || !postToDelete.id) return;
        setIsDeleting(true);
        try {
            await deleteForumPost(communityId, postToDelete);
            setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
            toast({ title: "Post Deleted", description: "Your post has been successfully removed." });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete post." });
        } finally {
            setIsDeleting(false);
            setIsDeleteAlertOpen(false);
            setPostToDelete(null);
        }
    };

    const handleFormSubmit = async (data: PostFormValues) => {
        if (editingPost) {
            await handleUpdatePost(data);
        } else {
            await handleCreatePost(data);
        }
    };
    
    const handleUpdatePost = async (data: PostFormValues) => {
        if (!editingPost || !editingPost.id) return;
        
        try {
            const updatedData = {
                title: data.title,
                content: data.content,
            };
            await updateForumPost(communityId, editingPost.id, updatedData);
            
            // Optimistic update
            setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...updatedData } : p));
            toast({ title: "Post Updated!", description: "Your changes have been saved." });
            handleDialogClose();
        } catch(e) {
             toast({ variant: "destructive", title: "Update Failed", description: "Could not save your changes." });
        }
    };

    const handleCreatePost = async (data: PostFormValues) => {
        if (!user) {
            toast({ 
                variant: "destructive", 
                title: "Authentication Error", 
                description: "You must be logged in to create a post." 
            });
            return;
        }

        const username = profile?.username || user.displayName;
        if (!username) {
             toast({ 
                variant: "destructive", 
                title: "Profile Error", 
                description: "Your username could not be found. Please try again." 
            });
            return;
        }
        
        form.clearErrors();
        let postId = "";

        try {
            // 1. Create the post document to get an ID
            const newPost = {
                forumId: communityId,
                title: data.title,
                content: data.content,
                authorId: user.uid,
                authorUsername: username,
                authorAvatarUrl: profile?.avatarUrl || user.photoURL || "",
                imageUrls: [], // Start with empty array
            };
            postId = await addForumPost(newPost);


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
                ...newPost,
                imageUrls,
                createdAt: new Date(), // Use JS Date for optimistic update
                upvotes: [],
                downvotes: [],
                commentCount: 0,
            };
            
            setPosts(prevPosts => [newPostForState, ...prevPosts]);

            toast({
                title: "Post Created!",
                description: "Your post is now live in the community.",
            });

            // 5. Reset form and close dialog
            form.reset();
            handleDialogClose();
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
    
    const isPostButtonDisabled = form.formState.isSubmitting || authLoading || (!user);


    return (
        <div className="container mx-auto py-8">
            <Card className="w-full shadow-xl mb-6 overflow-hidden">
                {community.bannerUrl && (
                    <div className="relative w-full h-48 md:h-64 bg-muted">
                        <Image
                            src={community.bannerUrl}
                            alt={`${community.name} banner`}
                            layout="fill"
                            objectFit="cover"
                            priority
                        />
                    </div>
                )}
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
                 <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                        <Button className="text-base" disabled={!user || authLoading}>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            {authLoading ? "Loading..." : "Create Post"}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingPost ? "Edit your post" : `Create a new post in ${community.name}`}</DialogTitle>
                            <DialogDescription>
                                {editingPost ? "Make changes to your post below." : "Share your thoughts, questions, or plants with the community."}
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-2">
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
                                {!editingPost && (
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
                                )}
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={handleDialogClose}>Cancel</Button>
                                    <Button type="submit" disabled={isPostButtonDisabled}>
                                        {form.formState.isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                <span>{editingPost ? "Saving..." : "Posting..."}</span>
                                            </>
                                        ) : (editingPost ? "Save Changes" : "Create Post")}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            isOwner={user?.uid === post.authorId}
                            onEdit={handleEditPost}
                            onDeleteInitiate={handleDeleteInitiate}
                        />
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
            
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your post and all of its associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeletePost} disabled={isDeleting} className={cn(isDeleting && "bg-destructive/80")}>
                           {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                           {isDeleting ? 'Deleting...' : 'Yes, delete post'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

    