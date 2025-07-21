
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getShippingRequirements, type ShippingRequirementsInput, type ShippingRequirementsOutput } from "@/ai/flows/shipping-guide-flow";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Globe, FileText, Anchor, ShieldAlert, Package, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    // Add more countries as needed
];

const shippingGuideSchema = z.object({
  fromCountry: z.string({ required_error: "Please select a departure country." }),
  toCountry: z.string({ required_error: "Please select a destination country." }),
  plantSpecies: z.string().min(3, "Please enter a valid plant species."),
}).refine(data => data.fromCountry !== data.toCountry, {
    message: "Shipping and destination countries cannot be the same.",
    path: ["toCountry"],
});

type ShippingGuideFormValues = z.infer<typeof shippingGuideSchema>;

function ResultsDisplay({ data, from, to, plant }: { data: ShippingRequirementsOutput, from: string, to: string, plant: string }) {
    const fromCountryName = COUNTRIES.find(c => c.code === from)?.name || from;
    const toCountryName = COUNTRIES.find(c => c.code === to)?.name || to;

    const renderLink = (link: string, text: string) => (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
            {text} <ExternalLink className="h-3 w-3" />
        </a>
    );

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Shipping Guide: {plant}</CardTitle>
                <CardDescription>
                    From <span className="font-semibold text-foreground">{fromCountryName}</span> to <span className="font-semibold text-foreground">{toCountryName}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.prohibited.isProhibited && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Shipping Prohibited</AlertTitle>
                        <AlertDescription>{data.prohibited.reason}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Summary of Requirements</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {data.summary.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                
                <Accordion type="single" collapsible className="w-full mt-6">
                    <AccordionItem value="pc">
                        <AccordionTrigger>Phytosanitary Certificate (PC)</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                            <p><span className="font-semibold">Required:</span> {data.phytoCertificate.required ? 'Yes' : 'No'}</p>
                            {data.phytoCertificate.required && <>
                                <p><span className="font-semibold">Issuing Body:</span> {data.phytoCertificate.issuingBody}</p>
                                <p><span className="font-semibold">How to Apply:</span> {renderLink(data.phytoCertificate.applicationLink, "Official Application Portal")}</p>
                                <p className="text-xs text-muted-foreground pt-2">{data.phytoCertificate.notes}</p>
                            </>}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="cites">
                        <AccordionTrigger>CITES Permit</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                            <p><span className="font-semibold">CITES Listed:</span> {data.citesPermit.isListed ? `Yes, Appendix ${data.citesPermit.appendix}` : 'No'}</p>
                             {data.citesPermit.isListed && <>
                                {data.citesPermit.exportPermitLink && <p><span className="font-semibold">Export Permit ({fromCountryName}):</span> {renderLink(data.citesPermit.exportPermitLink, "Apply Here")}</p>}
                                {data.citesPermit.importPermitLink && <p><span className="font-semibold">Import Permit ({toCountryName}):</span> {renderLink(data.citesPermit.importPermitLink, "Apply Here")}</p>}
                                <p className="text-xs text-muted-foreground pt-2">{data.citesPermit.notes}</p>
                            </>}
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="ip">
                        <AccordionTrigger>Import Permit (Buyer Responsibility)</AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                             <p><span className="font-semibold">Required:</span> {data.importPermit.required ? 'Yes' : 'No'}</p>
                             {data.importPermit.required && <>
                                <p><span className="font-semibold">Issuing Body:</span> {data.importPermit.issuingBody}</p>
                                {data.importPermit.applicationLink && <p><span className="font-semibold">How to Apply:</span> {renderLink(data.importPermit.applicationLink, "Official Application Portal")}</p>}
                                <p className="text-xs text-muted-foreground pt-2">{data.importPermit.notes}</p>
                            </>}
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="customs">
                        <AccordionTrigger>Customs & Declarations</AccordionTrigger>
                        <AccordionContent className="text-sm">
                            <p className="whitespace-pre-wrap">{data.customs.guidance}</p>
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="packaging">
                        <AccordionTrigger>Packaging & Shipping Best Practices</AccordionTrigger>
                        <AccordionContent className="text-sm">
                            <p className="whitespace-pre-wrap">{data.packaging.guidance}</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <p className="text-xs text-muted-foreground mt-6 text-center">{data.disclaimer}</p>
            </CardContent>
        </Card>
    );
}

export default function ShippingGuidePage() {
  const [results, setResults] = useState<ShippingRequirementsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [lastRequest, setLastRequest] = useState<ShippingGuideFormValues | null>(null);

  const form = useForm<ShippingGuideFormValues>({
    resolver: zodResolver(shippingGuideSchema),
    defaultValues: { plantSpecies: "" },
  });

  const onSubmit = async (data: ShippingGuideFormValues) => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setLastRequest(data);

    try {
      const output = await getShippingRequirements(data);
      setResults(output);
      toast({
        title: "Compliance Guide Generated",
        description: "Review the requirements for your shipment below.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to get requirements: ${errorMessage}`);
      toast({
        variant: "destructive",
        title: "Error Generating Guide",
        description: "There was a problem fetching the compliance data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card>
        <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Globe className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">International Shipping Guide</CardTitle>
            <CardDescription>
                Understand the compliance requirements for shipping plants globally.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <FormField
                            control={form.control}
                            name="fromCountry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shipping From</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="toCountry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shipping To</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="plantSpecies"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Plant Species (Scientific Name)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Monstera deliciosa" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Fetching Guide...</>
                        ) : (
                            "Get Requirements"
                        )}
                    </Button>
                </form>
            </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && lastRequest && (
        <ResultsDisplay data={results} from={lastRequest.fromCountry} to={lastRequest.toCountry} plant={lastRequest.plantSpecies} />
      )}
    </div>
  );
}

    