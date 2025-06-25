
"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusCircle, UserPlus, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

// Mock data for communities - replace with Firestore data later
const mockCommunities = [
    { id: "1", name: "Cactus Collectors", description: "A community for lovers of all things spiky.", members: 125 },
    { id: "2", name: "Houseplant Heroes", description: "Share your indoor jungles and get care tips.", members: 340 },
    { id: "3", name: "Rare Plant Traders", description: "For those hunting and trading unique specimens.", members: 88 },
    { id: "4", name: "Bonsai Beginners", description: "Learn the art of bonsai with fellow novices.", members: 55 },
];

// Mock data for posts - replace with Firestore data later
const mockPosts = [
    { id: "p1", title: "My new Astrophytum Asterias!", author: "User123", replies: 5, communityId: "1" },
    { id: "p2", title: "Help! What's wrong with my Fiddle Leaf Fig?", author: "FigFan", replies: 12, communityId: "2" },
    { id: "p3", title: "Looking to trade Monstera Albo cutting", author: "RareHunter", replies: 3, communityId: "3" },
    { id: "p4", title: "My first attempt at wiring a bonsai", author: "BonsaiNewbie", replies: 8, communityId: "4" },
    { id: "p5", title: "Check out this rare succulent bloom!", author: "CactiFanatic", replies: 2, communityId: "1" },
];

export default function CommunityPage() {
    const params = useParams();
    const { toast } = useToast();
    const communityId = params.communityId as string;

    // Find community from mock data (replace with Firestore fetch later)
    const community = mockCommunities.find(c => c.id === communityId);
    const communityPosts = mockPosts.filter(p => p.communityId === communityId);

    const handleJoinCommunity = () => {
        // Placeholder for actual join logic
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

    if (!community) {
        return (
            <div className="container mx-auto py-8 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle>Community Not Found</CardTitle>
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

            {communityPosts.length > 0 ? (
                <div className="space-y-4">
                    {communityPosts.map(post => (
                        <Card key={post.id} className="shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-xl hover:text-primary">
                                    {/* <Link href={`/forums/${communityId}/post/${post.id}`}> */}
                                    {post.title}
                                    {/* </Link> */}
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Posted by {post.author} &bull; {post.replies} replies
                                </CardDescription>
                            </CardHeader>
                            {/* <CardContent>
                <p className="text-sm line-clamp-2">Post content snippet would go here...</p>
              </CardContent> */}
                            <CardFooter>
                                {/* <Link href={`/forums/${communityId}/post/${post.id}`}> */}
                                <Button variant="outline" size="sm" className="hover:bg-muted hover:text-muted-foreground">View Post</Button>
                                {/* </Link> */}
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
