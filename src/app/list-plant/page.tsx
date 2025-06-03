
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
import { UploadCloud, DollarSign, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Image from "next/image";
import { MultiSelect } from "@/components/ui/multi-select"; // Assuming you have a MultiSelect component

const plantListingSchema = z.object({
  name: z.string().min(3, { message: "Plant name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.coerce.number().optional(),
  type: z.enum(["sale", "trade", "sale_trade"], { required_error: "Please select a listing type." }),
  images: z.custom<FileList>().refine((files) => files && files.length > 0, "At least one image is required."),

  tags: z.array(z.string()).optional(),
});

type PlantListingFormValues = z.infer<typeof plantListingSchema>;

export default function ListPlantPage() {
  const { toast } = useToast();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<PlantListingFormValues>({
    resolver: zodResolver(plantListingSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined, // Initially no type selected
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPreviews: string[] = [];
      for (let i = 0; i < files.length; i++) {
        newPreviews.push(URL.createObjectURL(files[i]));
      }
      setImagePreviews(newPreviews.slice(0, 5)); // Limit previews
      form.setValue("images", files); // Set FileList for react-hook-form
    }
  };

  function onSubmit(data: PlantListingFormValues) {
    // In a real app, you would upload images and submit data to a backend
    console.log(data);
    toast({
      title: "Plant Listed!",
      description: `${data.name} has been successfully listed.`,
    });
    form.reset();
    setImagePreviews([]);
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
                        <Input type="number" placeholder="Enter price if applicable" {...field} className="text-base" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

 <FormField
 control={form.control}
 name="tags"
 render={({ field }) => (
 <FormItem>
 <FormLabel className="text-lg">Tags (Optional)</FormLabel>
 <FormControl>
 <MultiSelect
 placeholder="Select relevant tags"
 options={[ // Example tags, replace with your actual tag list
 { label: "Low Light", value: "low-light" },
 { label: "Pet Friendly", value: "pet-friendly" },
 { label: "Beginner", value: "beginner" },
 { label: "Rare", value: "rare" },
 ]}
 {...field}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Plant Images (up to 5)</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-file"
                          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary bg-muted/50 hover:bg-muted"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {imagePreviews.map((src, index) => (
                    <div key={index} className="relative w-full aspect-square rounded-md overflow-hidden border">
                      <Image src={src} alt={`Preview ${index + 1}`} layout="fill" objectFit="cover" />
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full text-lg py-6" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Listing..." : "List Plant"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
