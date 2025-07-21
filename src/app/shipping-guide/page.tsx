// src/app/shipping-guide/page.tsx
"use client";

import { useState } from "react";
import { countryList, getComplianceRequirements, type ComplianceRule, type Country } from "@/lib/shipping-data";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Globe, ArrowRight, Search, FileText, BookCheck, ShieldAlert, Package, ExternalLink, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function RequirementSection({
  title,
  required,
  children,
  icon: Icon,
}: {
  title: string;
  required: boolean;
  children: React.ReactNode;
  icon: React.ElementType;
}) {
  return (
    <AccordionItem value={title.toLowerCase().replace(/ /g, "-")}>
      <AccordionTrigger className="text-lg">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <span>{title}</span>
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              required ? "bg-destructive/10 text-destructive" : "bg-green-600/10 text-green-700"
            }`}
          >
            {required ? "Required" : "Not Required"}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pl-12 border-l-2 border-primary/20 ml-3">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ShippingGuidePage() {
  const [fromCountry, setFromCountry] = useState<string>("");
  const [toCountry, setToCountry] = useState<string>("");
  const [plantSpecies, setPlantSpecies] = useState<string>("");
  const [results, setResults] = useState<ComplianceRule | null | undefined>(undefined);

  const handleSearch = () => {
    if (!fromCountry || !toCountry || !plantSpecies) {
      // Maybe show a toast message here
      return;
    }
    const requirements = getComplianceRequirements(fromCountry, toCountry, plantSpecies);
    setResults(requirements);
  };

  const selectedFromCountry = countryList.find(c => c.code === fromCountry);
  const selectedToCountry = countryList.find(c => c.code === toCountry);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
            <Globe className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">International Shipping Guide</CardTitle>
          <CardDescription>
            Get an overview of plant shipping requirements between countries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-4 border rounded-lg bg-muted/50 mb-8">
            <div className="md:col-span-2">
              <label htmlFor="from-country" className="text-sm font-medium">Shipping From</label>
              <Select onValueChange={setFromCountry} value={fromCountry}>
                <SelectTrigger id="from-country"><SelectValue placeholder="Select Country" /></SelectTrigger>
                <SelectContent>
                  {countryList.map((country) => (
                    <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="to-country" className="text-sm font-medium">Shipping To</label>
              <Select onValueChange={setToCountry} value={toCountry}>
                <SelectTrigger id="to-country"><SelectValue placeholder="Select Country" /></SelectTrigger>
                <SelectContent>
                  {countryList.map((country) => (
                    <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5">
              <label htmlFor="plant-species" className="text-sm font-medium">Plant Species (Scientific Name)</label>
              <Input
                id="plant-species"
                placeholder="e.g., Monstera deliciosa"
                value={plantSpecies}
                onChange={(e) => setPlantSpecies(e.target.value)}
              />
            </div>
            <div className="md:col-span-5">
                <Button onClick={handleSearch} className="w-full text-lg" disabled={!fromCountry || !toCountry || !plantSpecies}>
                    <Search className="mr-2 h-5 w-5" />
                    Get Requirements
                </Button>
            </div>
          </div>
          
          {results && selectedFromCountry && selectedToCountry && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-center">
                    Shipping from {selectedFromCountry.name} to {selectedToCountry.name}
                    <br />
                    for <span className="text-primary italic">{plantSpecies}</span>
                </h2>
                <Accordion type="multiple" className="w-full" defaultValue={['phytosanitary-certificate-pc']}>
                    <RequirementSection title="Phytosanitary Certificate (PC)" required={results.pcRequired} icon={FileText}>
                       <div className="space-y-3 text-sm">
                            <p><strong>Issuing Authority:</strong> {results.pcInfo.nppoName}</p>
                            <p>{results.pcInfo.notes}</p>
                            <Button asChild variant="link" className="p-0 h-auto">
                                <a href={results.pcInfo.applicationLink} target="_blank" rel="noopener noreferrer">Apply Here <ExternalLink className="ml-2 h-4 w-4"/></a>
                            </Button>
                       </div>
                    </RequirementSection>
                    <RequirementSection title="CITES Permits" required={results.citesRequired} icon={BookCheck}>
                        <div className="space-y-3 text-sm">
                            <p><strong>CITES Appendix:</strong> {results.citesInfo.appendix}</p>
                            <p>{results.citesInfo.notes}</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button asChild variant="link" className="p-0 h-auto">
                                    <a href={results.citesInfo.exportAuthorityLink} target="_blank" rel="noopener noreferrer">Export Permit ({fromCountry}) <ExternalLink className="ml-2 h-4 w-4"/></a>
                                </Button>
                                <Button asChild variant="link" className="p-0 h-auto">
                                    <a href={results.citesInfo.importAuthorityLink} target="_blank" rel="noopener noreferrer">Import Permit ({toCountry}) <ExternalLink className="ml-2 h-4 w-4"/></a>
                                </Button>
                            </div>
                       </div>
                    </RequirementSection>
                    <RequirementSection title="Buyer Import Permit (IP)" required={results.ipRequired} icon={ShieldAlert}>
                         <div className="space-y-3 text-sm">
                            <p><strong>Issuing Authority:</strong> {results.ipInfo.agencyName}</p>
                            <p>{results.ipInfo.notes}</p>
                            <Button asChild variant="link" className="p-0 h-auto">
                                <a href={results.ipInfo.applicationLink} target="_blank" rel="noopener noreferrer">Buyer Applies Here <ExternalLink className="ml-2 h-4 w-4"/></a>
                            </Button>
                       </div>
                    </RequirementSection>
                </Accordion>
                <Alert variant="default" className="bg-amber-100/50 border-amber-300">
                    <Info className="h-4 w-4 !text-amber-600"/>
                    <AlertTitle className="font-semibold !text-amber-800">Disclaimer</AlertTitle>
                    <AlertDescription className="!text-amber-700">
                        This information is for guidance only. Regulations can change. Always verify requirements with the official government agencies of both countries before shipping.
                    </AlertDescription>
                </Alert>
            </div>
          )}

          {results === null && (
             <div className="text-center py-8 text-muted-foreground">
                <p>No specific compliance rules found for this combination.</p>
                <p>Please check official government sources for both countries.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
