
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getUserPlantListings } from "@/lib/firestoreService";
import type { PlantListing } from "@/models";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Rocket, PlusCircle, Loader2, Inbox, Percent } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


const campaignSchema = z.object({
  name: z.string().min(5, "Campaign name must be at least 5 characters long."),
  type: z.enum(["percentage_discount", "fixed_discount", "free_shipping"]),
  value: z.coerce.number().min(0, "Discount value cannot be negative."),
  applicationType: z.enum(["all_plants", "specific_plants"]),
  appliesTo: z.array(z.string()),
}).refine(data => {
    if (data.applicationType === 'specific_plants') {
        return data.appliesTo.length > 0;
    }
    return true;
}, {
    message: "You must select at least one plant for the campaign.",
    path: ["appliesTo"],
});


type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [userPlants, setUserPlants] = useState<PlantListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const form = useForm<CampaignFormValues>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            name: "",
            type: "percentage_discount",
            value: 0,
            applicationType: "all_plants",
            appliesTo: [],
        },
    });

    const applicationType = form.watch("applicationType");

    useEffect(() => {
        if (user?.uid) {
            const fetchPlants = async () => {
                setIsLoading(true);
                try {
                    const plants = await getUserPlantListings(user.uid);
                    setUserPlants(plants.filter(p => p.isAvailable && !p.tradeOnly)); // Only allow campaigns on available, for-sale plants
                } catch (error) {
                    console.error("Failed to fetch user plants:", error);
                    toast({ variant: 'destructive', title: 'Could not load your plant listings.' });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPlants();
        }
    }, [user, toast]);

    const plantOptions = userPlants.map(plant => ({
        value: plant.id!,
        label: `${plant.name} ($${plant.price?.toFixed(2)})`,
    }));
    
    async function onSubmit(data: CampaignFormValues) {
        setIsSubmitting(true);
        console.log("Campaign Data:", data);
        // Here you would typically save the campaign data to Firestore
        // For this example, we'll just simulate it.
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: "Campaign Created (Simulated)",
            description: `Your "${data.name}" campaign has been saved.`,
        });
        setIsSubmitting(false);
        setShowCreateForm(false);
        form.reset();
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <Rocket className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Promotional Campaigns</h1>
                        <p className="text-muted-foreground">Create and manage sales to attract more buyers.</p>
                    </div>
                </div>
                {!showCreateForm && (
                     <Button onClick={() => setShowCreateForm(true)}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Create New Campaign
                    </Button>
                )}
            </div>
            
            <Separator className="mb-6"/>

            {showCreateForm ? (
                 <Card className="max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>New Campaign Details</CardTitle>
                        <CardDescription>Set up the rules for your new promotion.</CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Summer Succulent Sale" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Campaign Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a campaign type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="percentage_discount">Percentage Discount (%)</SelectItem>
                                                        <SelectItem value="fixed_discount" disabled>Fixed Discount ($) (coming soon)</SelectItem>
                                                        <SelectItem value="free_shipping" disabled>Free Shipping (coming soon)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount Value</FormLabel>
                                                 <div className="relative">
                                                     <Input type="number" placeholder="e.g., 15" {...field} className="pr-8"/>
                                                     <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                 </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 </div>

                                <FormField
                                    control={form.control}
                                    name="applicationType"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Applies To</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    className="flex flex-col space-y-1"
                                                >
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="all_plants" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            All Plants
                                                        </FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <RadioGroupItem value="specific_plants" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">
                                                            Specific Plants
                                                        </FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {applicationType === 'specific_plants' && (
                                    <FormField
                                        control={form.control}
                                        name="appliesTo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select Plants</FormLabel>
                                                <MultiSelect
                                                    options={plantOptions}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="Select plants for this campaign..."
                                                />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => { setShowCreateForm(false); form.reset(); }}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Launch Campaign
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                 </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Campaigns</CardTitle>
                        <CardDescription>
                            A list of your active and past promotional campaigns will appear here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-center py-12">
                            <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-xl font-semibold">No campaigns yet</h3>
                            <p className="mt-1 text-muted-foreground">Click "Create New Campaign" to get started.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
