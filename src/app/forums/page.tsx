
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Users, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getForums, createForum } from "@/lib/firestoreService";
import type { Forum } from "@/models";


const forumSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters." }).max(50, { message: "Name cannot be longer than 50 characters." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(200, { message: "Description cannot be longer than 200 characters." }),
});

type ForumFormValues = z.infer<typeof forumSchema>;

export default function ForumsListPage() {
    const [forums, setForums] = useState<Forum[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const { toast } = useToast();
    const { user } = useAuth();

    const form = useForm<ForumFormValues>({
        resolver: zodResolver(forumSchema),
        defaultValues: { name: "", description: "" },
    });

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

    const handleCreateCommunity = async (data: ForumFormValues) => {
        if (!user) {
            toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to create a community." });
            return;
        }

        try {
            const newForumId = await createForum({
                name: data.name,
                description: data.description,
                creatorId: user.uid,
            });
            const newForum = await getForumById(newForumId);
            if (newForum) {
                setForums(prev => [newForum, ...prev]);
            }
            toast({
                title: "Community Created!",
                description: `The "${data.name}" community is now live.`,
            });
            form.reset();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error creating community:", error);
            toast({
                variant: "destructive",
                title: "Creation Failed",
                description: "There was an error creating the community. Please try again.",
            });
        }
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="text-lg py-2 h-auto">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create Community
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create a New Community</DialogTitle>
                            <DialogDescription>
                                Start a new discussion hub for fellow plant lovers. Give it a name and a short description.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleCreateCommunity)} className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Community Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Cactus Collectors" {...field} />
                                            </FormControl>
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
                                            <FormControl>
                                                <Textarea placeholder="What is this community about?" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                            </>
                                        ) : "Create Community"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
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
