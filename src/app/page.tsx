
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gem, Leaf, ShoppingBag, Users, Instagram, Twitter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const contactSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    message: z.string().min(10, "Message must be at least 10 characters.").max(500, "Message cannot exceed 500 characters."),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const FeatureCard = ({ icon: Icon, title, description, image, imageHint }: { icon: React.ElementType, title: string, description: string, image: string, imageHint: string }) => (
    <Card className="flex flex-col text-center bg-card/50 h-full shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="p-6 items-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-primary/10">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover"
                    data-ai-hint={imageHint}
                />
            </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 flex flex-col flex-grow items-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4 w-fit">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold mb-2">{title}</CardTitle>
            <p className="text-muted-foreground flex-grow">{description}</p>
        </CardContent>
    </Card>
)

function ContactFormCard() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
        },
    });

    const onSubmit = async (data: ContactFormValues) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Failed to send message.');
            }

            toast({
                title: 'Message Sent!',
                description: "Thanks for reaching out. We'll get back to you soon.",
            });
            form.reset();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: 'destructive',
                title: 'Error',
                description: `There was a problem sending your message: ${errorMessage}`,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Contact Us</CardTitle>
                <CardDescription>Have a question or feedback? We'd love to hear from you.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl><Textarea placeholder="Your message..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Message
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function LandingPage() {
  return (
    <>
        <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center text-center md:text-left">
            <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-primary">
                The Marketplace for Plant People.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
                Sprout is the ultimate community for discovering, trading, and selling plants, fungi, and supplies. Find your next green companion and connect with enthusiasts who share your passion.
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
                <Button asChild size="lg">
                <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                <Link href="/catalog">Browse Listings</Link>
                </Button>
            </div>
            </div>
            <div className="relative w-full h-80 md:h-full min-h-[300px] rounded-2xl shadow-xl overflow-hidden">
                <Image
                    src="/main.jpeg"
                    alt="A vibrant arrangement of various houseplants on shelves"
                    fill
                    className="object-cover"
                    priority
                    data-ai-hint="vibrant houseplants"
                />
            </div>
        </div>
        </section>

       <section className="relative bg-muted pt-20 md:pt-28 pb-20 md:pb-28">
            <div className="absolute top-0 left-[-2%] right-[-2%] w-auto overflow-hidden leading-none">
                 <svg
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="relative block w-full h-[120px]"
                >
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        className="animate-wave fill-background"
                    ></path>
                    <path
                        d="M985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83Z"
                        className="animate-wave-behind fill-accent"
                    ></path>
                </svg>
            </div>

            <div className="container mx-auto">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Grow</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Sprout provides the tools and community to take your passion to the next level.</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={ShoppingBag}
                        title="Discover & Trade"
                        description="Explore a vast, user-powered catalog of plants and fungi. From rare aroids to gourmet mushroom cultures, find exactly what you're looking for or list your own items for sale or trade."
                        image="/selltrade.jpeg"
                        imageHint="plants market"
                    />
                    <FeatureCard
                        icon={Users}
                        title="Join a Community"
                        description="Jump into topic-specific forums to ask questions, share your latest plant victories, diagnose problems, and connect with growers who share your specific interests."
                        image="/community.jpeg"
                        imageHint="people plants community"
                    />
                    <FeatureCard
                        icon={Gem}
                        title="Powerful Seller Tools"
                        description="Upgrade to a Pro plan to unlock a full suite of seller tools. Access advanced analytics, marketing insights, and everything you need to manage and grow your business."
                        image="/seller.jpeg"
                        imageHint="analytics dashboard"
                    />
                </div>
            </div>
        </section>

        <section className="py-20 md:py-28 bg-background">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-start">
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold">About Sprout</h2>
                    <p className="text-muted-foreground">
                        We are passionate plant collectors who wanted a better way to connect with fellow enthusiasts. Sprout was born from a desire to create a beautiful, modern, and user-friendly platform for trading, selling, and discussing all things plants and fungi. Our mission is to cultivate a vibrant community where everyone, from novice growers to seasoned botanists, can share their passion and grow together.
                    </p>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Follow Our Journey</h3>
                        <div className="flex items-center gap-4">
                            <Link href="https://www.instagram.com/sprout.marketplace/?hl=en" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                                <Instagram className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                            </Link>
                             <Link href="https://x.com/SproutMarketApp" aria-label="X (formerly Twitter)" target="_blank" rel="noopener noreferrer">
                                <Twitter className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                            </Link>
                        </div>
                    </div>
                </div>
                <div>
                     <ContactFormCard />
                </div>
            </div>
        </section>
    </>
  );
}

    