"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, UserPlus, MessagesSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getForumById, getPostsForForum } from "@/lib/firestoreService";
import type { Forum, Post } from "@/models";

export default function CommunityPage() {
    const params = useParams();
    const { toast } = useToast();
    const communityId = params.communityId as string;

    const [community, setCommunity] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const handleCreatePost = () => {
        toast({
            title: "Create Post (Coming Soon)",
            description: "Functionality to create new posts will be added soon!",
        });
    }

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
                <Button onClick={handleCreatePost} className="text-base">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Post
                </Button>
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
                                <p className="text-sm line-clamp-2">{post.content}</p>
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
