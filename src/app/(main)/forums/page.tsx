"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockCommunities = [
    { id: "1", name: "Cactus Collectors", description: "A community for lovers of all things spiky.", members: 125 },
    { id: "2", name: "Houseplant Heroes", description: "Share your indoor jungles and get care tips.", members: 340 },
    { id: "3", name: "Rare Plant Traders", description: "For those hunting and trading unique specimens.", members: 88 },
    { id: "4", name: "Bonsai Beginners", description: "Learn the art of bonsai with fellow novices.", members: 55 },
];

export default function ForumsListPage() {
    const { toast } = useToast();

    const handleCreateCommunity = () => {
        toast({
            title: "Create Community (Coming Soon)",
            description: "Functionality to create new communities will be added soon!",
        });
    };

    return (
        <div className="container mx-auto py-8">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    Community Forums
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Find your tribe. Discuss, share, and learn with fellow plant enthusiasts.
                </p>
            </header>

            <div className="mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search for a community..."
                        className="w-full rounded-lg bg-background pl-10 pr-4 py-2 text-lg"
                    />
                </div>
                <Button onClick={handleCreateCommunity} className="text-lg py-2 h-auto">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Community
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockCommunities.map(community => (
                    <Card key={community.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-xl group-hover:text-primary">
                                <Link href={`/forums/${community.id}`} className="hover:underline">
                                    {community.name}
                                </Link>
                            </CardTitle>
                            <CardDescription>{community.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow" />
                        <CardFooter className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4">
                            <div className="flex items-center">
                                <Users className="mr-2 h-4 w-4" />
                                <span>{community.members} members</span>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/forums/${community.id}`}>View</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
