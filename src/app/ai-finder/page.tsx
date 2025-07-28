
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { plantMatchFromPhoto, type PlantMatchFromPhotoOutput } from "@/ai/flows/plant-match-from-photo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, UploadCloud, AlertTriangle, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AiPlantFinderPage() {
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [results, setResults] = useState<PlantMatchFromPhotoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // Check for 4MB limit (common for GenAI models)
        setError("File size exceeds 4MB. Please choose a smaller image.");
        setImagePreview(null);
        setPhotoDataUri(null);
        return;
      }
      setError(null); // Clear previous error
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setImagePreview(dataUri);
        setPhotoDataUri(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!photoDataUri) {
      setError("Please upload a photo first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const output = await plantMatchFromPhoto({
        photoDataUri,
        numberOfMatches: 3, // Defaulting to 3 matches
      });
      setResults(output);
      toast({
        title: "Analysis Complete!",
        description: "Found some item matches for you.",
      });
    } catch (err) {
      console.error("AI Finder error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to find items: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem processing your photo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
            <Sparkles className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">AI Item Finder</CardTitle>
          <CardDescription>
            Upload a photo of a plant or fungus, and our AI will help you find similar types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="plant-photo-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-primary bg-muted/50 hover:bg-muted"
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image src={imagePreview} alt="Item preview" layout="fill" objectFit="contain" className="rounded-md" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 4MB</p>
                  </div>
                )}
                <Input
                  id="plant-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload item photo"
                />
              </label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading || !photoDataUri}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Find Similar Items
                </>
              )}
            </Button>
          </form>

          {results && results.matches.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-semibold mb-4 text-foreground">Matching Items:</h3>
              <ul className="space-y-3">
                {results.matches.map((plantName, index) => (
                  <li key={index} className="p-4 border rounded-lg bg-background flex items-center shadow-sm">
                    <Leaf className="w-5 h-5 mr-3 text-primary" />
                    <span className="text-lg">{plantName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results && results.matches.length === 0 && !isLoading && (
             <Alert className="mt-8">
                <Leaf className="h-4 w-4" />
                <AlertTitle>No Matches Found</AlertTitle>
                <AlertDescription>
                  Our AI couldn't find any direct matches. Try a different photo or angle.
                </AlertDescription>
              </Alert>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
                AI suggestions are for informational purposes. Always verify item identification with trusted sources.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
