"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getForums } from "@/lib/firestoreService";
import type { Forum } from "@/models";

export default function ForumsListPage() {
    const [forums, setForums] = useState<Forum[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchForums = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const fetchedForums = await getForums();
                setForums(fetchedForums);
            } catch (err) {
                console.error("Error fetching forums:", err);
                setError("Failed to load communities. Please try again later.");
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not fetch community list.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchForums();
    }, [toast]);

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

            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-destructive">
                    <h2 className="text-2xl font-semibold">{error}</h2>
                </div>
            ) : forums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forums.map(forum => (
                        <Card key={forum.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-xl group-hover:text-primary">
                                    <Link href={`/forums/${forum.id}`} className="hover:underline">
                                        {forum.name}
                                    </Link>
                                </CardTitle>
                                <CardDescription>{forum.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow" />
                            <CardFooter className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4">
                                <div className="flex items-center">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>{forum.memberCount || 0} members</span>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/forums/${forum.id}`}>View</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold text-muted-foreground">No communities found.</h2>
                    <p className="mt-2 text-muted-foreground">Why not be the first to create one?</p>
                </div>
            )}
        </div>
    );
}
