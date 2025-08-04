
"use client";

import Image from "next/image";
import Link from "next/link";
import { Gem, Leaf, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
            <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none">
                 <svg
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="relative block fill-background w-full h-[120px]"
                >
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                        className="animate-wave"
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
    </>
  );
}
