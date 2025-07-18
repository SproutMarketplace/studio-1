
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { getPlantListing, updatePlantListing, uploadPlantImage, deletePlantImageByUrl } from "@/lib/firestoreService";
import type { PlantListing } from "@/models";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, UploadCloud, X, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Schema for form validation
const listPlantSchema = z.object({
  name: z.string().min(3, { message: "Plant name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }),
  price: z.coerce.number().min(0).optional(),
  tradeOnly: z.boolean().default(false),
  location: z.string().optional(),
  tags: z.array(z.string()).max(5, { message: "You can add a maximum of 5 tags." }).optional().default([]),
  quantity: z.coerce.number().min(0, { message: "Quantity cannot be negative." }).default(1),
});

type ListPlantFormValues = z.infer<typeof listPlantSchema>;

const MAX_IMAGES = 5;

export default function EditPlantPage() {
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const plantId = params.plantId as string;

    const [plant, setPlant] = useState<PlantListing | null>(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image states
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

    const [tagInput, setTagInput] = useState("");

    const form = useForm<ListPlantFormValues>({
        resolver: zodResolver(listPlantSchema),
        defaultValues: {
            name: "",
            description: "",
            price: undefined,
            tradeOnly: false,
            location: "",
            tags: [],
            quantity: 1,
        },
    });

    useEffect(() => {
        if (!plantId || authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchAndVerify = async () => {
            setIsPageLoading(true);
            try {
                const fetchedPlant = await getPlantListing(plantId);
                if (!fetchedPlant) {
                    setPageError("Plant not found.");
                    return;
                }
                if (fetchedPlant.ownerId !== user.uid) {
                    setPageError("You are not authorized to edit this listing.");
                    return;
                }
                setPlant(fetchedPlant);
                setExistingImageUrls(fetchedPlant.imageUrls);
                form.reset({
                    name: fetchedPlant.name,
                    description: fetchedPlant.description,
                    price: fetchedPlant.price,
                    tradeOnly: fetchedPlant.tradeOnly,
                    location: fetchedPlant.location || "",
                    tags: fetchedPlant.tags || [],
                    quantity: fetchedPlant.quantity || 1,
                });
            } catch (e) {
                setPageError("Failed to load plant data. Please try again.");
                console.error(e);
            } finally {
                setIsPageLoading(false);
            }
        };

        fetchAndVerify();
    }, [plantId, user, authLoading, router, form]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const totalImages = existingImageUrls.length + imageFiles.length + files.length;
            if (totalImages > MAX_IMAGES) {
                toast({
                    variant: "destructive",
                    title: "Image limit exceeded",
                    description: `You can only have up to ${MAX_IMAGES} images in total.`,
                });
                return;
            }

            setImageFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
            event.target.value = "";
        }
    };

    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const newPreviews = [...prev];
            const removedPreview = newPreviews.splice(index, 1);
            if (removedPreview[0]) {
                URL.revokeObjectURL(removedPreview[0]);
            }
            return newPreviews;
        });
    };

    const removeExistingImage = (url: string) => {
        setImagesToRemove(prev => [...prev, url]);
        setExistingImageUrls(prev => prev.filter(u => u !== url));
    };

    async function onSubmit(data: ListPlantFormValues) {
        if (!user || !plant) {
            toast({ variant: "destructive", title: "Error", description: "Cannot submit form. User or plant data is missing." });
            return;
        }
        
        const totalImageCount = existingImageUrls.length + imageFiles.length;
        if (totalImageCount === 0) {
            toast({ variant: "destructive", title: "No Image", description: "You must have at least one image for your plant." });
            return;
        }

        setIsSubmitting(true);
        try {
            await Promise.all(imagesToRemove.map(url => deletePlantImageByUrl(url)));
            const newImageUrls = await Promise.all(
                imageFiles.map((file, index) =>
                    uploadPlantImage(plant.id!, file, Date.now() + index) // Use a more unique index
                )
            );
            const finalImageUrls = [...existingImageUrls, ...newImageUrls];

            const updateData: Partial<PlantListing> = {
                ...data,
                imageUrls: finalImageUrls,
            };
            // Ensure isAvailable is correctly set based on quantity
            updateData.isAvailable = data.quantity > 0;

            await updatePlantListing(plant.id!, updateData);

            toast({ title: "Success!", description: "Your plant listing has been updated." });
            router.push(`/plant/${plant.id}`);
        } catch (error) {
            console.error("Failed to update plant:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "An unexpected error occurred. Please try again." });
            setIsSubmitting(false);
        }
    }
    
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.trim();
            const currentTags = form.getValues('tags') || [];
            if (newTag && currentTags.length < 5 && !currentTags.includes(newTag)) {
                form.setValue('tags', [...currentTags, newTag]);
                setTagInput("");
            } else if (currentTags.length >= 5) {
                toast({ variant: "destructive", title: "Tag limit reached" });
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        form.setValue('tags', form.getValues('tags').filter(tag => tag !== tagToRemove));
    };

    if (isPageLoading) return <EditPlantSkeleton />;

    if (pageError) {
        return (
            <div className="container mx-auto max-w-2xl py-8">
                <Card className="shadow-lg text-center">
                    <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
                    <CardContent><p>{pageError}</p></CardContent>
                </Card>
            </div>
        );
    }
    
    const isButtonDisabled = isSubmitting || authLoading;
    const currentTotalImages = existingImageUrls.length + imageFiles.length;

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full"><Pencil className="w-8 h-8 text-primary" /></div>
                        <div>
                            <CardTitle className="text-3xl font-bold">Edit Plant Listing</CardTitle>
                            <CardDescription>Update the details of your plant below.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField name="name" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel className="text-lg">Plant Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField name="description" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel className="text-lg">Description</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>

                            <FormItem>
                                <FormLabel className="text-lg">Plant Images</FormLabel>
                                <div className="p-4 border-2 border-dashed rounded-lg border-border bg-muted/50 space-y-4">
                                    {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 w-full">
                                            {existingImageUrls.map((url) => (
                                                <div key={url} className="relative aspect-square">
                                                    <Image src={url} alt="Existing plant" layout="fill" objectFit="cover" className="rounded-md" />
                                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={() => removeExistingImage(url)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ))}
                                            {imagePreviews.map((src, index) => (
                                                <div key={src} className="relative aspect-square">
                                                    <Image src={src} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                                                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={() => removeNewImage(index)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {currentTotalImages < MAX_IMAGES && (
                                        <label htmlFor="image-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/80">
                                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Add more images</span></p>
                                            <Input id="image-upload" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} disabled={currentTotalImages >= MAX_IMAGES} />
                                        </label>
                                    )}
                                </div>
                                <FormDescription className="mt-2">You can have up to {MAX_IMAGES} images. The first image will be the cover photo.</FormDescription>
                            </FormItem>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField name="price" control={form.control} render={({ field }) => (
                                    <FormItem><FormLabel className="text-lg">Price ($)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} /></FormControl><FormDescription>Leave blank or 0 if only trading.</FormDescription><FormMessage /></FormItem>
                                )}/>
                                 <FormField
                                  control={form.control}
                                  name="quantity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-lg">Quantity</FormLabel>
                                      <FormControl>
                                        <Input type="number" min="0" step="1" {...field} onChange={e => field.onChange(e.target.value === '' ? 0 : e.target.valueAsNumber)} value={field.value ?? 0}/>
                                      </FormControl>
                                      <FormDescription>
                                        How many of this item do you have?
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            </div>

                             <FormField
                                control={form.control}
                                name="tradeOnly"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-lg">Trade Only?</FormLabel>
                                            <FormDescription>If checked, this plant will only be available for trade.</FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}/>

                            <FormField name="location" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel className="text-lg">Location (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormDescription>Providing a location can help local buyers find your plant.</FormDescription><FormMessage /></FormItem>
                            )}/>
                            
                             <FormField name="tags" control={form.control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg">Tags (Optional)</FormLabel>
                                    <FormControl>
                                        <div>
                                            {(field.value && field.value.length > 0) && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {field.value.map((tag) => (
                                                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                                            {tag}
                                                            <button type="button" onClick={() => removeTag(tag)} className="ml-1 outline-none ..."><XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <Input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder={field.value.length < 5 ? "Type a tag and press Enter..." : "Tag limit reached"} disabled={field.value.length >= 5}/>
                                        </div>
                                    </FormControl>
                                    <FormDescription>Add up to 5 custom tags.</FormDescription><FormMessage />
                                </FormItem>
                            )}/>

                            <Button type="submit" className="w-full text-lg py-6" disabled={isButtonDisabled}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Changes...</> : "Save Changes"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}


function EditPlantSkeleton() {
    return (
        <div className="container mx-auto max-w-2xl py-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-20 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-40 w-full" /></div>
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

    