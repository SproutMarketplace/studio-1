
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getPostById, getCommentsForPost, addCommentToPost, togglePostVote } from "@/lib/firestoreService";
import type { Post, Comment } from "@/models";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Timestamp } from "firebase/firestore";
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
import { Loader2, ArrowUp, ArrowDown, MessageCircle, Send, User as UserIcon, ChevronLeft, ChevronRight, ArrowLeft, CornerDownRight } from "lucide-react";


const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(2000, "Comment is too long."),
});
type CommentFormValues = z.infer<typeof commentSchema>;

function CommentForm({
    onSubmit,
    isSubmitting,
    onCancel,
    placeholder = "Add your comment...",
    buttonText = "Post Comment"
}: {
    onSubmit: (data: CommentFormValues) => Promise<void>;
    isSubmitting: boolean;
    onCancel?: () => void;
    placeholder?: string;
    buttonText?: string;
}) {
    const form = useForm<CommentFormValues>({
        resolver: zodResolver(commentSchema),
        defaultValues: { content: "" },
    });

    const handleSubmit = async (data: CommentFormValues) => {
        await onSubmit(data);
        form.reset();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">Your Comment</FormLabel>
                            <FormControl>
                                <Textarea placeholder={placeholder} {...field} rows={2} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end gap-2">
                    {onCancel && (
                         <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                         </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {buttonText}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

function CommentComponent({ comment, onReply, replies }: { comment: Comment, onReply: (data: CommentFormValues, parentId: string) => Promise<void>, replies: Comment[] }) {
    const { user } = useAuth();
    const [isReplying, setIsReplying] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    
    const getFormattedDate = (date: Timestamp | Date) => {
        const dateToFormat = date instanceof Timestamp ? date.toDate() : date;
        return formatDistanceToNow(dateToFormat, { addSuffix: true });
    };

    const handleReplySubmit = async (data: CommentFormValues) => {
        setIsSubmittingReply(true);
        await onReply(data, comment.id);
        setIsSubmittingReply(false);
        setIsReplying(false);
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorUsername} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href={`/profile/${comment.authorId}`} className="font-semibold hover:underline">{comment.authorUsername}</Link>
                        <span className="text-muted-foreground">&bull; {getFormattedDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-foreground mt-1 whitespace-pre-wrap">{comment.content}</p>
                    <div className="mt-1">
                       {user && (
                         <Button variant="ghost" size="sm" onClick={() => setIsReplying(!isReplying)}>
                            <CornerDownRight className="w-4 h-4 mr-2"/>
                            Reply
                         </Button>
                       )}
                    </div>
                </div>
            </div>
            <div className="pl-8 pt-4">
                 {isReplying && (
                    <CommentForm
                        onSubmit={handleReplySubmit}
                        isSubmitting={isSubmittingReply}
                        onCancel={() => setIsReplying(false)}
                        placeholder={`Replying to ${comment.authorUsername}...`}
                        buttonText="Post Reply"
                    />
                 )}
                 {replies.map(reply => (
                    <div key={reply.id} className="mt-4">
                         <CommentComponent comment={reply} onReply={onReply} replies={[]} />
                    </div>
                 ))}
            </div>
        </div>
    );
}


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
    const [postFound, setPostFound] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [voteLoading, setVoteLoading] = useState<null | 'up' | 'down'>(null);


    useEffect(() => {
        if (!communityId || !postId) return;

        const fetchPostAndComments = async () => {
            setIsLoading(true);
            try {
                const postData = await getPostById(communityId, postId);

                if (postData) {
                    const commentsData = await getCommentsForPost(communityId, postId);
                    setPost(postData);
                    setComments(commentsData as Comment[]);
                    setPostFound(true);
                } else {
                    setPostFound(false);
                }
            } catch (err) {
                console.error("Error fetching post details:", err);
                setPostFound(false);
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
        setVoteLoading(voteType === 'upvote' ? 'up' : 'down');
        try {
            await togglePostVote(communityId, postId, user.uid, voteType);
            // Optimistic update
            setPost(prevPost => {
                if (!prevPost) return null;
                const upvotes = new Set(prevPost.upvotes || []);
                const downvotes = new Set(prevPost.downvotes || []);
                const currentVote = upvotes.has(user.uid) ? 'upvote' : downvotes.has(user.uid) ? 'downvote' : null;

                upvotes.delete(user.uid);
                downvotes.delete(user.uid);
                
                if (voteType !== currentVote) {
                    if (voteType === 'upvote') {
                        upvotes.add(user.uid);
                    } else { // downvote
                        downvotes.add(user.uid);
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

    const handleCommentSubmit = async (data: CommentFormValues, parentId: string | null = null) => {
        if (!user || !profile || !post) {
            toast({ variant: 'destructive', title: 'You must be logged in to comment.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const newCommentData = {
                postId: postId,
                forumId: communityId,
                authorId: user.uid,
                authorUsername: profile.username,
                authorAvatarUrl: profile.avatarUrl || "",
                content: data.content,
                parentId,
            };
            const newCommentId = await addCommentToPost(communityId, postId, newCommentData);
            
            // Optimistic update
            const optimisticComment: Comment = {
                id: newCommentId,
                ...newCommentData,
                replyCount: 0,
                createdAt: new Date(),
            };

            setComments(prev => [...prev, optimisticComment]);

            setPost(p => p ? ({ ...p, commentCount: p.commentCount + 1 }) : null);
            if (parentId) {
                setComments(prev => prev.map(c => c.id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c));
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to post comment.' });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };


    const nextImage = () => {
        if (post?.imageUrls && post.imageUrls.length > 1) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % post.imageUrls!.length);
        }
    };

    const prevImage = () => {
        if (post?.imageUrls && post.imageUrls.length > 1) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + post.imageUrls!.length) % post.imageUrls!.length);
        }
    };
    
    const { rootComments, repliesByParentId } = useMemo(() => {
        const root: Comment[] = [];
        const replies: Record<string, Comment[]> = {};
        for (const comment of comments) {
            if (comment.parentId) {
                if (!replies[comment.parentId]) {
                    replies[comment.parentId] = [];
                }
                replies[comment.parentId].push(comment);
            } else {
                root.push(comment);
            }
        }
        return { rootComments: root, repliesByParentId: replies };
    }, [comments]);


    if (isLoading) return <PostPageSkeleton />;
    
    if (postFound === false) {
        notFound();
    }
    
    if (!post) {
      return <PostPageSkeleton />;
    }

    const voteCount = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
    const userVote = post.upvotes?.includes(user?.uid || '') ? 'up' : post.downvotes?.includes(user?.uid || '') ? 'down' : null;
    const getFormattedDate = (date: Timestamp | Date) => {
        const dateToFormat = date instanceof Timestamp ? date.toDate() : date;
        return formatDistanceToNow(dateToFormat, { addSuffix: true });
    };

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
                            fill
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
                        {' '} &bull; {post.createdAt ? getFormattedDate(post.createdAt as Timestamp) : ''}
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
                             <CommentForm onSubmit={handleCommentSubmit} isSubmitting={isSubmitting} />
                        </CardContent>
                    </Card>
                )}
                {!user && (
                    <div className="text-center p-4 border rounded-md mb-6">
                        <p><Link href="/login" className="text-primary underline">Log in</Link> or <Link href="/signup" className="text-primary underline">sign up</Link> to leave a comment.</p>
                    </div>
                )}
                
                <div className="space-y-6">
                    {rootComments.map(comment => (
                        <CommentComponent
                            key={comment.id}
                            comment={comment}
                            onReply={handleCommentSubmit}
                            replies={repliesByParentId[comment.id] || []}
                        />
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
