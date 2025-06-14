
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, DollarSign, Repeat, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { MultiSelect } from "@/components/ui/multi-select";
import { useAuth } from "@/contexts/auth-context";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE_MB = 4;

const plantListingSchema = z.object({
  name: z.string().min(3, { message: "Plant name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)), // Convert empty string to undefined, otherwise to number
    z.number({ invalid_type_error: "Price must be a number." }).positive({message: "Price must be positive."}).optional()
  ),
  type: z.enum(["sale", "trade", "sale_trade"], { required_error: "Please select a listing type." }),
  images: z.custom<FileList>()
    .refine((files) => files && files.length > 0, "At least one image is required.")
    .refine((files) => files && files.length <= MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`)
    .refine((files) => Array.from(files).every(file => file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024), `Each image must be less than ${MAX_IMAGE_SIZE_MB}MB.`),
  tags: z.array(z.string()).optional(),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }).optional(),
});

type PlantListingFormValues = z.infer<typeof plantListingSchema>;

export default function ListPlantPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});


  const form = useForm<PlantListingFormValues>({
    resolver: zodResolver(plantListingSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      tags: [],
      images: undefined,
      location: profile?.location || "",
    },
  });

   React.useEffect(() => {
    if (profile?.location) {
      form.setValue("location", profile.location);
    }
  }, [profile, form]);


  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const selectedFiles = Array.from(files).slice(0, MAX_IMAGES);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      
      const dataTransfer = new DataTransfer();
      selectedFiles.forEach(file => dataTransfer.items.add(file));
      form.setValue("images", dataTransfer.files, { shouldValidate: true });
    }
  };

  async function onSubmit(data: PlantListingFormValues) {
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "You must be logged in to list a plant." });
      return;
    }
    setIsSubmittingForm(true);
    setUploadProgress({});

    const imageFiles = data.images ? Array.from(data.images) : [];
    const imageUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const imageStorageRef = storageRef(storage, `plantImages/${user.uid}/${uniqueFileName}`);
        
        const uploadTask = uploadBytesResumable(imageStorageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            },
            (error) => {
              console.error("Upload failed for", file.name, error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              imageUrls.push(downloadURL);
              resolve();
            }
          );
        });
      }

      const plantDoc = {
        name: data.name,
        description: data.description,
        price: data.price,
        type: data.type,
        imageUrls,
        tags: data.tags || [],
        location: data.location || profile?.location || "Not specified",
        sellerId: user.uid,
        sellerName: profile?.name || user.displayName || "Anonymous",
        sellerAvatar: profile?.avatarUrl || user.photoURL || "",
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        isSold: false,
      };

      await addDoc(collection(db, "plants"), plantDoc);

      toast({
        title: "Plant Listed!",
        description: `${data.name} has been successfully listed.`,
      });
      form.reset();
      setImagePreviews([]);
      router.push("/"); 
    } catch (error: any) {
      console.error("Error listing plant:", error);
      toast({
        variant: "destructive",
        title: "Listing Failed",
        description: error.message || "Could not list your plant. Please try again.",
      });
    } finally {
      setIsSubmittingForm(false);
      setUploadProgress({});
    }
  }

  const listingType = form.watch("type");

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">List Your Plant</CardTitle>
          <CardDescription className="text-center">
            Share your green beauties with the Sprout community.
          </CardDescription>
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
                      <Input placeholder="e.g., Monstera Albo" {...field} className="text-base" />
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
                      <Textarea
                        placeholder="Tell us about your plant: condition, size, care tips, etc."
                        className="resize-y min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Listing Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-base">
                          <SelectValue placeholder="Select listing type (Sale, Trade, Both)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sale">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" /> For Sale
                          </div>
                        </SelectItem>
                        <SelectItem value="trade">
                          <div className="flex items-center">
                            <Repeat className="w-4 h-4 mr-2" /> For Trade
                          </div>
                        </SelectItem>
                        <SelectItem value="sale_trade">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" /> / <Repeat className="w-4 h-4 ml-1 mr-2" /> Sale or Trade
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(listingType === "sale" || listingType === "sale_trade") && (
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Enter price if applicable" {...field} value={field.value ?? ""} className="text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
               <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} className="text-base" />
                    </FormControl>
                     <FormDescription>Where is this plant located or where can it be picked up/shipped from?</FormDescription>
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
                <FormControl>
                <MultiSelect
                  placeholder="Select relevant tags"
                  options={[ 
                    { label: "Easy Care", value: "Easy Care" },
                    { label: "Low Light", value: "Low Light" },
                    { label: "Bright Light", value: "Bright Light" },
                    { label: "Pet Friendly", value: "Pet Friendly" },
                    { label: "Beginner", value: "Beginner" },
                    { label: "Rare", value: "Rare" },
                    { label: "Variegated", value: "Variegated" },
                    { label: "Flowering", value: "Flowering" },
                    { label: "Cuttings", value: "Cuttings" },
                    { label: "Established Plant", value: "Established Plant" },
                  ]}
                  value={field.value || []}
                  onChange={field.onChange}
                />
                </FormControl>
                <FormMessage />
                </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="images"
                render={({ fieldState }) => ( // Use fieldState to access error
                  <FormItem>
                    <FormLabel className="text-lg">Plant Images (up to {MAX_IMAGES}, max {MAX_IMAGE_SIZE_MB}MB each)</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-file"
                          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer  hover:border-primary bg-muted/50 hover:bg-muted ${fieldState.error ? 'border-destructive' : 'border-border'}`}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF (MAX. {MAX_IMAGE_SIZE_MB}MB)</p>
                          </div>
                          <Input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                          />
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Clear photos help your plant find a new home faster!
                    </FormDescription>
                    <FormMessage /> {/* This will display validation messages for images */}
                  </FormItem>
                )}
              />
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative w-full aspect-square rounded-md overflow-hidden border">
                      <Image src={src} alt={`Preview ${index + 1}`} layout="fill" objectFit="cover" />
                       {isSubmittingForm && uploadProgress[Array.from(form.getValues("images") || [])[index]?.name] !== undefined && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-sm">
                            {uploadProgress[Array.from(form.getValues("images") || [])[index]?.name].toFixed(0)}%
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmittingForm}>
                {isSubmittingForm ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Listing...</> : "List Plant"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
