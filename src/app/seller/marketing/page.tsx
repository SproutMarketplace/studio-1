
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Star, Tag, Share2 } from "lucide-react";

export default function MarketingPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-6 flex items-center gap-3">
                <Megaphone className="h-8 w-8" /> Marketing Tools
            </h1>
            <p className="text-muted-foreground mb-6">Promote your listings and grow your reach with these powerful tools. More features are coming soon!</p>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Star className="h-6 w-6 text-primary" />
                            <CardTitle>Featured Listings</CardTitle>
                        </div>
                        <CardDescription>Boost visibility for your best plants.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full">
                        <p className="mb-4 text-sm text-muted-foreground flex-grow">Make your plant appear at the top of search results and on the homepage. This will be part of a future Sprout Pro subscription.</p>
                        <Button disabled>Feature a Listing (Coming Soon)</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Tag className="h-6 w-6 text-primary" />
                            <CardTitle>Run a Sale</CardTitle>
                        </div>
                        <CardDescription>Create custom discount campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full">
                        <p className="mb-4 text-sm text-muted-foreground flex-grow">Offer discounts on specific plants or your entire collection to attract more buyers and drive sales.</p>
                        <Button disabled>Create a Campaign (Coming Soon)</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-3">
                            <Share2 className="h-6 w-6 text-primary" />
                            <CardTitle>Social Sharing Tools</CardTitle>
                        </div>
                        <CardDescription>Share your profile with your followers.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col h-full">
                        <p className="mb-4 text-sm text-muted-foreground flex-grow">Easily share a link to your Sprout shop or specific listings on your social media accounts to bring in external customers.</p>
                        <Button disabled>Get Sharable Links (Coming Soon)</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
