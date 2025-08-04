
"use client";

import Image from "next/image";
import Link from "next/link";
import { Gem, Leaf, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeatureCard = ({ icon: Icon, title, description, image }: { icon: React.ElementType, title: string, description: string, image: string }) => (
    <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
            <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
            />
        </div>
        <div className="space-y-4">
            <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full">
                <Icon className="w-6 h-6" />
                <h3 className="text-2xl font-bold">{title}</h3>
            </div>
            <p className="text-lg text-muted-foreground">{description}</p>
        </div>
    </div>
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
                />
            </div>
        </div>
        </section>

        <div className="relative bg-muted">
            <div className="absolute top-0 inset-x-0 transform -translate-y-px">
                <svg className="w-full h-auto" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 22.4L144 32C288 41.6 576 60.8 864 64C1152 67.2 1440 54.4 1440 48L1440 120H0V22.4Z" fill="hsl(var(--muted))"/>
                </svg>
            </div>
            <section className="py-20 md:py-28">
                <div className="container mx-auto space-y-20">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Grow</h2>
                        <p className="mt-4 text-lg text-muted-foreground">Sprout provides the tools and community to take your passion to the next level.</p>
                    </div>
                    
                    <FeatureCard 
                        icon={ShoppingBag}
                        title="Discover & Trade"
                        description="Explore a vast, user-powered catalog of plants and fungi. From rare aroids to gourmet mushroom cultures, find exactly what you're looking for or list your own items for sale or trade with a community of trusted enthusiasts."
                        image="/selltrade.jpeg"
                    />

                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4 md:order-2">
                            <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-4 py-2 rounded-full">
                                <Users className="w-6 h-6" />
                                <h3 className="text-2xl font-bold">Join a Community</h3>
                            </div>
                            <p className="text-lg text-muted-foreground">Jump into topic-specific forums to ask questions, share your latest plant victories, diagnose problems, and connect with growers who share your specific interests. It's the social hub for all things that grow.</p>
                        </div>
                        <div className="relative aspect-square rounded-lg overflow-hidden shadow-lg md:order-1">
                            <Image
                                src="/community.jpeg"
                                alt="Community Feature"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                    
                    <FeatureCard 
                        icon={Gem}
                        title="Powerful Seller Tools"
                        description="Upgrade to a Pro plan to unlock a full suite of seller tools. Access advanced analytics, marketing features, pricing insights, and everything you need to manage and grow your business."
                        image="/seller.jpeg"
                    />

                </div>
            </section>
        </div>
    </>
  );
}
