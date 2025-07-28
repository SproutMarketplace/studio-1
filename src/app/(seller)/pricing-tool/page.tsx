
"use client";

import { useState } from "react";
import { getPlantPricingInsights, type PlantPricingOutput } from "@/ai/flows/plant-pricing-flow";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, TrendingUp, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function StatCard({ title, value, loading }: { title: string, value: number, loading: boolean }) {
    return (
        <Card className="text-center">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                ) : (
                    <div className="text-2xl font-bold">
                        ${value.toFixed(2)}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function PricingToolPage() {
    const { toast } = useToast();
    const [plantName, setPlantName] = useState("");
    const [plantSize, setPlantSize] = useState("");
    const [plantAge, setPlantAge] = useState("");
    const [plantCondition, setPlantCondition] = useState("");
    const [results, setResults] = useState<PlantPricingOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plantName.trim()) {
            setError("Please enter an item name.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults(null);

        try {
            const output = await getPlantPricingInsights({ 
                plantName,
                size: plantSize || undefined,
                age: plantAge || undefined,
                condition: plantCondition || undefined,
            });
            setResults(output);
        } catch (err) {
            console.error("Pricing tool error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to get pricing data: ${errorMessage}`);
            toast({
                variant: "destructive",
                title: "Analysis Failed",
                description: "There was a problem getting pricing insights.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-3">
                <TrendingUp className="h-8 w-8" /> Pricing Insights Tool
            </h1>
            <p className="text-muted-foreground mb-6">
                Enter an item name to see its average selling price on Sprout over time.
            </p>

            <Card className="max-w-3xl mx-auto shadow-lg">
                <CardHeader>
                    <CardTitle>Analyze Item Prices</CardTitle>
                    <CardDescription>This premium tool helps you price your items competitively.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="space-y-2">
                             <label className="text-sm font-medium">Item Name*</label>
                             <Input
                                type="text"
                                placeholder="e.g., Monstera Albo, Lion's Mane Culture..."
                                value={plantName}
                                onChange={(e) => setPlantName(e.target.value)}
                                className="text-base h-11"
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Size (Optional)</label>
                                <Select onValueChange={setPlantSize} value={plantSize} disabled={isLoading}>
                                    <SelectTrigger className="text-base h-11"><SelectValue placeholder="Select size..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cutting">Cutting</SelectItem>
                                        <SelectItem value="small">Small (2-4" pot)</SelectItem>
                                        <SelectItem value="medium">Medium (4-6" pot)</SelectItem>
                                        <SelectItem value="large">Large (6"+ pot)</SelectItem>
                                        <SelectItem value="xlarge">Extra Large</SelectItem>
                                        <SelectItem value="culture-plate">Culture Plate</SelectItem>
                                        <SelectItem value="spore-syringe">Spore Syringe</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Age (Optional)</label>
                                <Select onValueChange={setPlantAge} value={plantAge} disabled={isLoading}>
                                    <SelectTrigger className="text-base h-11"><SelectValue placeholder="Select age..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="seedling">Seedling</SelectItem>
                                        <SelectItem value="young">Young Plant</SelectItem>
                                        <SelectItem value="mature">Mature Plant</SelectItem>
                                        <SelectItem value="mycelium">Mycelium</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Condition (Optional)</label>
                                <Select onValueChange={setPlantCondition} value={plantCondition} disabled={isLoading}>
                                    <SelectTrigger className="text-base h-11"><SelectValue placeholder="Select condition..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pristine">Pristine</SelectItem>
                                        <SelectItem value="good">Good (Minor flaws)</SelectItem>
                                        <SelectItem value="fair">Fair (Needs TLC)</SelectItem>
                                        <SelectItem value="contaminated">Contaminated</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button type="submit" className="w-full text-lg h-12" disabled={isLoading || !plantName.trim()}>
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Search className="mr-2 h-5 w-5" />
                            )}
                            Analyze
                        </Button>
                    </form>
                    
                    {error && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {(isLoading || results) && (
                        <div className="mt-8 space-y-4">
                            <h3 className="text-lg font-semibold text-center">
                                Average Sales Price for: <span className="text-primary">{plantName} {plantSize && `(${plantSize})`}</span>
                            </h3>
                             <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                               <StatCard title="Last 7 Days" value={results?.last7days || 0} loading={isLoading} />
                               <StatCard title="Last 14 Days" value={results?.last14days || 0} loading={isLoading} />
                               <StatCard title="Last 30 Days" value={results?.last30days || 0} loading={isLoading} />
                               <StatCard title="Last 60 Days" value={results?.last60days || 0} loading={isLoading} />
                            </div>
                             <Alert variant="default" className="mt-6 bg-amber-100/50 border-amber-300">
                                <DollarSign className="h-4 w-4 !text-amber-600"/>
                                <AlertTitle className="font-semibold !text-amber-800">Disclaimer</AlertTitle>
                                <AlertDescription className="!text-amber-700">
                                    This data is for informational purposes only. Market prices can fluctuate. Consider your item's size, condition, and rarity when setting your final price.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
