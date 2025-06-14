
"use client";

import { useState, type FormEvent, useEffect } from "react";
import Image from "next/image";
import { MessagesSquare, Search, Users, PlusCircle, UploadCloud, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Mock data for communities - replace with Firestore data later
const mockCommunities = [
  { id: "1", name: "Cactus Collectors", description: "A community for lovers of all things spiky.", members: 125, imageUrl: "https://placehold.co/600x400.png", imageHint: "cactus desert" },
  { id: "2", name: "Houseplant Heroes", description: "Share your indoor jungles and get care tips.", members: 340, imageUrl: "https://placehold.co/600x400.png", imageHint: "houseplants indoor" },
  { id: "3", name: "Rare Plant Traders", description: "For those hunting and trading unique specimens.", members: 88, imageUrl: "https://placehold.co/600x400.png", imageHint: "rare plant" },
  { id: "4", name: "Bonsai Beginners", description: "Learn the art of bonsai with fellow novices.", members: 55, imageUrl: "https://placehold.co/600x400.png", imageHint: "bonsai tree" },
];

const createCommunitySchema = z.object({
  name: z.string().min(3, { message: "Community name must be at least 3 characters." }).max(50, { message: "Community name cannot exceed 50 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }).max(250, { message: "Description cannot exceed 250 characters." }),
  rules: z.string().min(10, { message: "Rules must be at least 10 characters." }),
  communityPicture: z.custom<FileList>().optional(),
  communityBanner: z.custom<FileList>().optional(),
});

type CreateCommunityFormValues = z.infer<typeof createCommunitySchema>;

export default function CommunityForumsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateCommunityDialogOpen, setIsCreateCommunityDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [communityPicturePreview, setCommunityPicturePreview] = useState<string | null>(null);
  const [communityBannerPreview, setCommunityBannerPreview] = useState<string | null>(null);

  const { toast } = useToast();

  const form = useForm<CreateCommunityFormValues>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      rules: "",
      communityPicture: undefined,
      communityBanner: undefined,
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };
  
  const onSubmitCreateCommunity = (data: CreateCommunityFormValues) => {
    // Simulate API call / Firestore write
    console.log("Creating community (simulated):", data);
    // Include file names for simulation if files were selected
    if (data.communityPicture && data.communityPicture.length > 0) {
      console.log("Community Picture:", data.communityPicture[0].name);
    }
    if (data.communityBanner && data.communityBanner.length > 0) {
      console.log("Community Banner:", data.communityBanner[0].name);
    }

    toast({
      title: "Community Created (Simulated)",
      description: `The community "${data.name}" has been created. (This is a simulation)`,
    });
    form.reset();
    setCommunityPicturePreview(null);
    setCommunityBannerPreview(null);
    setCurrentStep(1);
    setIsCreateCommunityDialogOpen(false);
  };

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof CreateCommunityFormValues)[] = ['name', 'description', 'rules'];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'picture' | 'banner') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'picture') {
          setCommunityPicturePreview(reader.result as string);
          form.setValue('communityPicture', event.target.files as FileList);
        } else {
          setCommunityBannerPreview(reader.result as string);
          form.setValue('communityBanner', event.target.files as FileList);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (type === 'picture') {
        setCommunityPicturePreview(null);
        form.setValue('communityPicture', undefined);
      } else {
        setCommunityBannerPreview(null);
        form.setValue('communityBanner', undefined);
      }
    }
  };
  
  const filteredCommunities = mockCommunities.filter(community =>
    community.name.toLowerCase().includes(searchTerm) ||
    community.description.toLowerCase().includes(searchTerm)
  );

  useEffect(() => {
    // Reset previews if dialog closes and reopens
    if (!isCreateCommunityDialogOpen) {
      setCommunityPicturePreview(null);
      setCommunityBannerPreview(null);
      setCurrentStep(1); // Reset to first step when dialog is closed
      form.reset(); // Also reset form fields
    }
  }, [isCreateCommunityDialogOpen, form]);


  return (
    <div className="container mx-auto py-8">
      <Card className="w-full shadow-xl mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
            <MessagesSquare className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Community Forums</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Find, join, and participate in plant-loving communities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for communities..."
                className="w-full rounded-lg bg-background pl-10 pr-4 py-2 text-base"
                onChange={handleSearchChange}
                value={searchTerm}
              />
            </div>
            <Dialog open={isCreateCommunityDialogOpen} onOpenChange={setIsCreateCommunityDialogOpen}>
              <DialogTrigger asChild>
                <Button className="text-base py-2 h-auto shrink-0">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Community
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create a New Community - Step {currentStep} of 2</DialogTitle>
                  <DialogDescription>
                    {currentStep === 1 ? "Define the basics of your new community." : "Add some visuals to make it stand out."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitCreateCommunity)} className="space-y-4 py-4">
                    {currentStep === 1 && (
                      <>
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Community Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Succulent Lovers" {...field} />
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
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="A brief description of your community's focus."
                                  className="resize-none"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="rules"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Community Rules</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Outline the guidelines for your community members (e.g., Be respectful, No spam, etc.)."
                                  className="resize-y min-h-[100px]"
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {currentStep === 2 && (
                      <>
                        <FormField
                          control={form.control}
                          name="communityPicture"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Community Picture (Optional)</FormLabel>
                              <FormControl>
                                <div>
                                   <Input 
                                    id="communityPicture" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileChange(e, 'picture')}
                                    className="mb-2"
                                   />
                                   {communityPicturePreview && (
                                     <div className="mt-2 w-32 h-32 relative border rounded-md overflow-hidden">
                                       <Image src={communityPicturePreview} alt="Community picture preview" layout="fill" objectFit="cover" />
                                     </div>
                                   )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="communityBanner"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Community Banner (Optional)</FormLabel>
                              <FormControl>
                                <div>
                                  <Input 
                                    id="communityBanner" 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => handleFileChange(e, 'banner')}
                                    className="mb-2"
                                  />
                                  {communityBannerPreview && (
                                     <div className="mt-2 w-full h-32 relative border rounded-md overflow-hidden">
                                       <Image src={communityBannerPreview} alt="Community banner preview" layout="fill" objectFit="cover" />
                                     </div>
                                   )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    <DialogFooter className="pt-4">
                      {currentStep === 1 && (
                        <>
                          <DialogClose asChild>
                            <Button type="button" variant="outline" className="hover:bg-muted hover:text-muted-foreground">Cancel</Button>
                          </DialogClose>
                          <Button type="button" onClick={handleNextStep}>Next</Button>
                        </>
                      )}
                      {currentStep === 2 && (
                        <>
                          <Button type="button" variant="outline" onClick={handlePreviousStep} className="hover:bg-muted hover:text-muted-foreground">
                             <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <Button type="submit">Create Community</Button>
                        </>
                      )}
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <Card key={community.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl group">
              <div className="relative w-full h-40">
                <Image 
                  src={community.imageUrl || "https://placehold.co/600x400.png"} 
                  alt={community.name} 
                  layout="fill" 
                  objectFit="cover" 
                  data-ai-hint={community.imageHint || community.name.toLowerCase()}
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  <Link href={`/forums/${community.id}`}>
                    {community.name}
                  </Link>
                </CardTitle>
                 <Badge variant="outline" className="w-fit">
                    <Users className="mr-1.5 h-3.5 w-3.5"/> {community.members} Members
                 </Badge>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">
                  {community.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Link href={`/forums/${community.id}`} className="w-full">
                  <Button variant="outline" className="w-full hover:bg-muted hover:text-muted-foreground">
                    View Community
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <Search className="w-16 h-16 mb-4 text-muted-foreground" />
            <p className="text-xl font-semibold text-foreground">No Communities Found</p>
            <p className="text-muted-foreground">
              Try a different search term, or create a new community!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
