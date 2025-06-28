
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";

import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { addPlantListing, updatePlantListing, uploadPlantImage } from "@/lib/firestoreService";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MultiSelect } from "@/components/ui/multi-select";
import { Loader2, PlusSquare, UploadCloud, X } from "lucide-react";

// Schema for form validation
const listPlantSchema = z.object({
  name: z.string().min(3, { message: "Plant name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }),
  price: z.coerce.number().min(0).optional(),
  tradeOnly: z.boolean().default(false),
  location: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

type ListPlantFormValues = z.infer<typeof listPlantSchema>;

// Predefined tags for users to select from
const TAG_OPTIONS = [
  { value: "rare", label: "Rare" },
  { value: "beginner-friendly", label: "Beginner Friendly" },
  { value: "pet-friendly", label: "Pet Friendly" },
  { value: "low-light", label: "Low Light" },
  { value: "bright-light", label: "Bright Light" },
  { value: "cacti", label: "Cacti" },
  { value: "succulent", label: "Succulent" },
  { value: "foliage", label: "Foliage" },
  { value: "flowering", label: "Flowering" },
];

const MAX_IMAGES = 5;

export default function ListPlantPage() {
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<ListPlantFormValues>({
    resolver: zodResolver(listPlantSchema),
    defaultValues: {
      name: "",
      description: "",
      price: undefined,
      tradeOnly: false,
      location: "",
      tags: [],
    },
  });

  useEffect(() => {
    if (profile?.location && !form.getValues('location')) {
      form.setValue('location', profile.location);
    }
  }, [profile, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const remainingSlots = MAX_IMAGES - imageFiles.length;
      if (files.length > remainingSlots) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: `You can only upload a maximum of ${MAX_IMAGES} images.`,
        });
      }
      const newFiles = files.slice(0, remainingSlots);

      setImageFiles(prev => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
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

  async function onSubmit(data: ListPlantFormValues) {
    if (!user || !profile || !profile.username) {
      toast({ variant: "destructive", title: "Authentication Error", description: "Your profile is still loading. Please wait a moment and try again." });
      return;
    }
    if (imageFiles.length === 0) {
      toast({ variant: "destructive", title: "No Image", description: "You must upload at least one image of your plant." });
      return;
    }

    setIsLoading(true);

    try {
      const plantId = await addPlantListing({
        ...data,
        price: data.price,
        ownerId: user.uid,
        ownerUsername: profile.username,
        ownerAvatarUrl: profile.avatarUrl || "",
        isAvailable: true,
        imageUrls: [], 
      });

      const imageUrls = await Promise.all(
        imageFiles.map((file, index) => uploadPlantImage(plantId, file, index))
      );

      await updatePlantListing(plantId, { imageUrls });
      
      router.push(`/plant/${plantId}?new_listing=true`);

    } catch (error) {
      console.error("Failed to list plant:", error);
      toast({
        variant: "destructive",
        title: "Listing Failed",
        description: "An unexpected error occurred. Please try again.",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <PlusSquare className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">List a New Plant</CardTitle>
              <CardDescription>Share your plant with the community. Fill out the details below.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Plant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monstera Deliciosa" {...field} />
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
                    <FormLabel className="text-lg">Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your plant, its condition, and care tips..." rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel className="text-lg">Plant Images</FormLabel>
                <div className="p-4 border-2 border-dashed rounded-lg border-border bg-muted/50">
                    {imagePreviews.length > 0 && (
                         <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-4 w-full">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative aspect-square">
                                <Image src={src} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10"
                                    onClick={() => removeImage(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    {imageFiles.length < MAX_IMAGES && (
                      <label htmlFor="image-upload" className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/80">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, or GIF (up to 4MB each)</p>
                        <Input id="image-upload" type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} disabled={imageFiles.length >= MAX_IMAGES} />
                      </label>
                    )}
                  </div>
                <FormDescription className="mt-2">You can upload up to {MAX_IMAGES} images. The first image will be the cover photo.</FormDescription>
              </FormItem>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 25.00" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''}/>
                      </FormControl>
                      <FormDescription>
                        Leave blank or 0 if you are only trading.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tradeOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-col rounded-lg border p-4 justify-between">
                        <div>
                            <FormLabel className="text-lg">Trade Only?</FormLabel>
                            <FormDescription>If checked, this plant will only be available for trade.</FormDescription>
                        </div>
                        <FormControl className="mt-2">
                             <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label="Trade only switch"
                            />
                        </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                     <FormDescription>Providing a location can help local buyers find your plant.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Tags (Optional)</FormLabel>
                     <MultiSelect
                      options={TAG_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select tags..."
                    />
                    <FormDescription>Tags help others discover your plant.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || authLoading}>
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Profile...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Listing Plant...
                  </>
                ) : (
                  "List My Plant"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
