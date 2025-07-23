
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Ticket, PlusCircle, Loader2, Inbox, Percent, DollarSign, Send, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";


const campaignSchema = z.object({
  name: z.string().min(5, "Campaign name must be at least 5 characters long."),
  type: z.enum(["percentage_discount", "fixed_discount", "free_shipping"]),
  value: z.coerce.number().optional(), // Optional since free shipping has no value
  applicationType: z.enum(["all_plants", "specific_plants"]),
  appliesTo: z.array(z.string()),
}).refine(data => {
    if ((data.type === 'percentage_discount' || data.type === 'fixed_discount') && (data.value === undefined || data.value <= 0)) {
        return false;
    }
    return true;
}, {
    message: "A discount value greater than 0 is required.",
    path: ["value"],
}).refine(data => {
    if (data.applicationType === 'specific_plants' && data.appliesTo.length === 0) {
        return false;
    }
    return true;
}, {
    message: "You must select at least one plant for a specific campaign.",
    path: ["appliesTo"],
});


type CampaignFormValues = z.infer<typeof campaignSchema>;

function ManualPromotionForm({ onCancel }: { onCancel: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [userPlants, setUserPlants] = useState<PlantListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

     const form = useForm<CampaignFormValues>({
        resolver: zodResolver(campaignSchema),
        defaultValues: {
            name: "",
            type: "percentage_discount",
            value: undefined,
            applicationType: "all_plants",
            appliesTo: [],
        },
    });

    const applicationType = form.watch("applicationType");
    const campaignType = form.watch("type");

     useEffect(() => {
        if (user?.uid) {
            const fetchPlants = async () => {
                setIsLoading(true);
                try {
                    const plants = await getUserPlantListings(user.uid);
                    setUserPlants(plants.filter(p => p.isAvailable && !p.tradeOnly));
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
            title: "Campaign Created (Simulated)",
            description: `Your "${data.name}" promotion has been saved.`,
        });
        setIsSubmitting(false);
        onCancel();
        form.reset();
    }


    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>New Manual Promotion</CardTitle>
                <CardDescription>Set up the rules for a sale you can run anytime.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Promotion Name</FormLabel>
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
                                        <FormLabel>Promotion Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a promotion type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="percentage_discount">Percentage Discount (%)</SelectItem>
                                                <SelectItem value="fixed_discount">Fixed Discount ($)</SelectItem>
                                                <SelectItem value="free_shipping">Free Shipping</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {campaignType !== 'free_shipping' && (
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount Value</FormLabel>
                                            <div className="relative">
                                                <Input 
                                                    type="number" 
                                                    placeholder={campaignType === 'percentage_discount' ? "e.g., 15" : "e.g., 5"} 
                                                    {...field}
                                                    className="pr-8"
                                                    value={field.value ?? ''}
                                                    onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                                                />
                                                {campaignType === 'percentage_discount' && <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
                                                {campaignType === 'fixed_discount' && <DollarSign className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
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
                                                <FormControl><RadioGroupItem value="all_plants" /></FormControl>
                                                <FormLabel className="font-normal">All Available Plants</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="specific_plants" /></FormControl>
                                                <FormLabel className="font-normal">Specific Plants</FormLabel>
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
                                            placeholder="Select plants for this promotion..."
                                            disabled={isLoading || plantOptions.length === 0}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Launch Promotion
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    )
}

function AutomatedCouponCard({
    title,
    description,
    icon: Icon,
    children
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    children: React.ReactNode
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    )
}

export default function CampaignsPage() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Ticket className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">Coupons & Promotions</h1>
                        <p className="text-muted-foreground">Create and manage sales to attract more buyers.</p>
                    </div>
                </div>
            </div>
            
            <Separator/>
            
            <section className="space-y-4">
                 <h2 className="text-2xl font-semibold">Automated Coupons</h2>
                 <p className="text-muted-foreground">Reward your customers automatically for their loyalty and engagement. Set them up once and let them run.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AutomatedCouponCard 
                        title="Thank You Coupon"
                        description="Automatically send a coupon to buyers after they complete a purchase from your shop."
                        icon={Send}
                    >
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Enable "Thank You" Coupons</FormLabel>
                                <FormDescription>Send a coupon after purchase.</FormDescription>
                            </div>
                             <Switch disabled/>
                        </div>
                    </AutomatedCouponCard>
                    <AutomatedCouponCard
                        title="New Follower Coupon"
                        description="Incentivize users to follow your shop by offering a small discount when they do."
                        icon={UserPlus}
                    >
                         <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Enable "New Follower" Coupons</FormLabel>
                                <FormDescription>Send a coupon upon follow.</FormDescription>
                            </div>
                            <Switch disabled />
                        </div>
                    </AutomatedCouponCard>
                </div>
            </section>
            
            <Separator/>

            <section className="space-y-4">
                <div className="flex justify-between items-center">
                     <div>
                        <h2 className="text-2xl font-semibold">Manual Promotions</h2>
                        <p className="text-muted-foreground">Run sales for specific events or to clear out inventory. You control when they are active.</p>
                    </div>
                    {!showCreateForm && (
                        <Button onClick={() => setShowCreateForm(true)}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Create Promotion
                        </Button>
                    )}
                </div>

                 {showCreateForm ? (
                    <ManualPromotionForm onCancel={() => setShowCreateForm(false)} />
                 ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Promotions</CardTitle>
                            <CardDescription>A list of your active and past promotions will appear here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <Inbox className="w-16 h-16 mx-auto text-muted-foreground" />
                                <h3 className="mt-4 text-xl font-semibold">No promotions yet</h3>
                                <p className="mt-1 text-muted-foreground">Click "Create Promotion" to get started.</p>
                            </div>
                        </CardContent>
                    </Card>
                 )}
            </section>
        </div>
    )
}
