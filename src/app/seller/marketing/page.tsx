
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Star, Share2, Rocket, Ticket } from "lucide-react";
import Link from "next/link";

export default function MarketingPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <Megaphone className="h-8 w-8" /> Marketing & Visibility
            </h1>
            <p className="text-muted-foreground mb-6">Tools to help your listings get noticed by more buyers. These premium features will be available with a Sprout Pro plan.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card className="flex flex-col">
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Ticket className="h-6 w-6 text-primary" />
                            <CardTitle>Coupons & Promotions</CardTitle>
                        </div>
                        <CardDescription>Run sales and create unique discount codes.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                        <p className="mb-4 text-sm text-muted-foreground flex-grow">Create excitement by running limited-time sales, offering fixed-amount or percentage discounts, or providing free shipping.</p>
                        <Button asChild>
                            <Link href="/seller/campaigns">Manage Promotions</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card className="flex flex-col">
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Star className="h-6 w-6 text-primary" />
                            <CardTitle>Featured Listings</CardTitle>
                        </div>
                        <CardDescription>Boost visibility for your best plants.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                        <p className="mb-4 text-sm text-muted-foreground flex-grow">Make your plant appear at the top of search results and on the homepage. The perfect way to get eyes on a rare plant or new arrival.</p>
                        <Button asChild>
                            <Link href="/seller/feature-listing">Feature a Listing</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Share2 className="h-6 w-6 text-primary" />
                            <CardTitle>AI Ad Generator</CardTitle>
                        </div>
                        <CardDescription>Create ads for external platforms.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                        <p className="mb-4 text-sm text-muted-foreground flex-grow">Automatically generate beautiful, shareable ad images for your listings to post on platforms like Instagram, Facebook, and Pinterest.</p>
                        <Button disabled>Generate Ad (Coming Soon)</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
