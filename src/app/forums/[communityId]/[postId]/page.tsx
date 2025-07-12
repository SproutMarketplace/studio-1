
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getPostById, getCommentsForPost, addCommentToPost, togglePostVote } from "@/lib/firestoreService";
import type { Post, Comment } from "@/models";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowUp, ArrowDown, MessageCircle, Send, User as UserIcon, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";


const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(2000, "Comment is too long."),
});
type CommentFormValues = z.infer<typeof commentSchema>;

export default function PostDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const communityId = params.communityId as string;
    const postId = params.postId as string;
    
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [voteLoading, setVoteLoading] = useState<null | 'up' | 'down'>(null);

    const form = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: { content: "" },
    });

    useEffect(() => {
        if (!communityId || !postId) return;

        const fetchPostAndComments = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [postData, commentsData] = await Promise.all([
                    getPostById(communityId, postId),
                    getCommentsForPost(communityId, postId),
                ]);

                if (!postData) {
                    setError("Post not found.");
                    return;
                }
                setPost(postData);
                setComments(commentsData);
            } catch (err) {
                console.error("Error fetching post details:", err);
                setError("Failed to load post. It may have been deleted.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPostAndComments();
    }, [communityId, postId]);
    
    const handleVote = async (voteType: 'upvote' | 'downvote') => {
        if (!user || !post) {
            toast({ variant: 'destructive', title: 'Please log in to vote.' });
            return;
        }
        setVoteLoading(voteType);
        try {
            await togglePostVote(communityId, postId, user.uid, voteType);
            // Optimistic update
            setPost(prevPost => {
                if (!prevPost) return null;
                const upvotes = new Set(prevPost.upvotes || []);
                const downvotes = new Set(prevPost.downvotes || []);

                if (voteType === 'upvote') {
                    if (upvotes.has(user.uid)) {
                        upvotes.delete(user.uid);
                    } else {
                        upvotes.add(user.uid);
                        downvotes.delete(user.uid);
                    }
                } else { // downvote
                    if (downvotes.has(user.uid)) {
                        downvotes.delete(user.uid);
                    } else {
                        downvotes.add(user.uid);
                        upvotes.delete(user.uid);
                    }
                }
                return { ...prevPost, upvotes: Array.from(upvotes), downvotes: Array.from(downvotes) };
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Vote failed. Please try again.' });
            console.error(error);
        } finally {
            setVoteLoading(null);
        }
    };

    const handleCommentSubmit = async (data: CommentFormValues) => {
        if (!user || !profile || !post) {
            toast({ variant: 'destructive', title: 'You must be logged in to comment.' });
            return;
        }
        try {
            const newComment = {
                postId: postId,
                forumId: communityId,
                authorId: user.uid,
                authorUsername: profile.username,
                authorAvatarUrl: profile.avatarUrl || "",
                content: data.content,
            };
            const newCommentId = await addCommentToPost(communityId, postId, newComment);
            
            // Optimistic update
            setComments(prev => [...prev, {
                id: newCommentId,
                ...newComment,
                createdAt: new Date() as unknown as Timestamp,
            }]);

            setPost(p => p ? ({ ...p, commentCount: p.commentCount + 1 }) : null);

            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to post comment.' });
            console.error(error);
        }
    };

    const nextImage = () => {
        if (post && post.imageUrls && post.imageUrls.length > 1) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % post.imageUrls.length);
        }
    };

    const prevImage = () => {
        if (post && post.imageUrls && post.imageUrls.length > 1) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + post.imageUrls.length) % post.imageUrls.length);
        }
    };
    
    if (isLoading) return <PostPageSkeleton />;
    if (error) {
        return (
            <div className="container mx-auto py-8 text-center">
                <Card>
                    <CardHeader><CardTitle className="text-destructive">{error}</CardTitle></CardHeader>
                    <CardContent>
                        <Button asChild className="mt-4"><Link href={`/forums/${communityId}`}>Back to Community</Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    if (!post) return notFound();

    const voteCount = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
    const userVote = post.upvotes?.includes(user?.uid || '') ? 'up' : post.downvotes?.includes(user?.uid || '') ? 'down' : null;

    return (
        <div className="container mx-auto max-w-3xl py-8">
            <Link href={`/forums/${communityId}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to community
            </Link>

            <Card className="shadow-lg">
                {post.imageUrls && post.imageUrls.length > 0 && (
                     <div className="relative w-full h-96 group/image bg-muted">
                        <Image
                            src={post.imageUrls[currentImageIndex]}
                            alt={`Image for post: ${post.title}`}
                            layout="fill"
                            objectFit="contain"
                        />
                         {post.imageUrls.length > 1 && (
                            <>
                                <Button size="icon" variant="ghost" onClick={prevImage} className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/50 hover:text-white">
                                    <ChevronLeft className="h-5 w-5"/>
                                </Button>
                                <Button size="icon" variant="ghost" onClick={nextImage} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 text-white opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-black/50 hover:text-white">
                                    <ChevronRight className="h-5 w-5"/>
                                </Button>
                            </>
                        )}
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
                    <CardDescription>
                        Posted by{' '}
                        <Link href={`/profile/${post.authorId}`} className="font-medium text-foreground hover:underline">
                            {post.authorUsername}
                        </Link>
                        {' '} &bull; {post.createdAt ? formatDistanceToNow((post.createdAt as Timestamp).toDate(), { addSuffix: true }) : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </CardContent>
                <CardFooter className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                         <Button variant="ghost" size="icon" onClick={() => handleVote('upvote')} disabled={voteLoading !== null}>
                            {voteLoading === 'up' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUp className={cn("h-5 w-5", userVote === 'up' && 'text-primary' )}/>}
                        </Button>
                        <span className="font-bold text-lg w-6 text-center">{voteCount}</span>
                         <Button variant="ghost" size="icon" onClick={() => handleVote('downvote')} disabled={voteLoading !== null}>
                            {voteLoading === 'down' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowDown className={cn("h-5 w-5", userVote === 'down' && 'text-destructive' )}/>}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}</span>
                    </div>
                </CardFooter>
            </Card>

            <Separator className="my-8" />

            <section>
                <h2 className="text-2xl font-bold mb-4">Comments</h2>
                {user && (
                    <Card className="mb-6 bg-muted/50">
                        <CardContent className="p-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleCommentSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="sr-only">Your Comment</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Add your comment..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Post Comment
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}
                {!user && (
                    <div className="text-center p-4 border rounded-md mb-6">
                        <p><Link href="/login" className="text-primary underline">Log in</Link> or <Link href="/signup" className="text-primary underline">sign up</Link> to leave a comment.</p>
                    </div>
                )}
                
                <div className="space-y-6">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-4">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorUsername} />
                                <AvatarFallback><UserIcon /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <Link href={`/profile/${comment.authorId}`} className="font-semibold hover:underline">{comment.authorUsername}</Link>
                                    <span className="text-muted-foreground">&bull; {formatDistanceToNow((comment.createdAt as Timestamp).toDate(), { addSuffix: true })}</span>
                                </div>
                                <p className="text-foreground mt-1">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    {comments.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">Be the first to comment on this post.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

function PostPageSkeleton() {
    return (
        <div className="container mx-auto max-w-3xl py-8">
             <Skeleton className="h-6 w-48 mb-4" />
             <Card>
                <Skeleton className="w-full h-96" />
                <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter>
                     <Skeleton className="h-8 w-32" />
                </CardFooter>
             </Card>
             <Separator className="my-8" />
             <Skeleton className="h-6 w-32 mb-4" />
             <div className="space-y-6">
                 {[1,2].map(i => (
                     <div key={i} className="flex items-start gap-4">
                         <Skeleton className="h-10 w-10 rounded-full" />
                         <div className="flex-1 space-y-2">
                             <Skeleton className="h-4 w-48" />
                             <Skeleton className="h-4 w-full" />
                         </div>
                     </div>
                 ))}
             </div>
        </div>
    );
}
