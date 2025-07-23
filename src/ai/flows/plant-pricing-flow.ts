
'use server';
/**
 * @fileOverview An AI agent that provides pricing insights for plants.
 *
 * - getPlantPricingInsights - A function that returns average sales data for a plant.
 * - PlantPricingInput - The input type for the function.
 * - PlantPricingOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlantPricingInputSchema = z.object({
  plantName: z
    .string()
    .describe(
      "The common or scientific name of the plant to get pricing data for."
    ),
  size: z.string().optional().describe("The size of the plant (e.g., Small, Medium, Large, Cutting, Seedling)."),
  age: z.string().optional().describe("The age of the plant (e.g., Seedling, Young, Mature)."),
});
export type PlantPricingInput = z.infer<typeof PlantPricingInputSchema>;

const PlantPricingOutputSchema = z.object({
  last7days: z.number().describe('The average sales price in the last 7 days.'),
  last14days: z.number().describe('The average sales price in the last 14 days.'),
  last30days: z.number().describe('The average sales price in the last 30 days.'),
  last60days: z.number().describe('The average sales price in the last 60 days.'),
});
export type PlantPricingOutput = z.infer<typeof PlantPricingOutputSchema>;

export async function getPlantPricingInsights(input: PlantPricingInput): Promise<PlantPricingOutput> {
  return plantPricingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'plantPricingPrompt',
  input: {schema: PlantPricingInputSchema},
  output: {schema: PlantPricingOutputSchema},
  prompt: `You are a plant market data analyst for a large online marketplace. Your role is to provide sellers with pricing insights based on historical sales data.

Given a plant name, and optionally its size and age, you must return the average selling price for that plant over various time periods. The prices should be realistic for the plant specified, reflecting its potential rarity, demand, size, and maturity.

A larger and more mature plant should have a higher price than a smaller, younger one or a cutting.

The values should fluctuate reasonably across the time periods. For example, a popular plant might see a slight price increase recently, while a common plant's price might be stable or slightly lower.

Plant to analyze: {{{plantName}}}
{{#if size}}Size: {{{size}}}{{/if}}
{{#if age}}Age: {{{age}}}{{/if}}
`,
});

const plantPricingFlow = ai.defineFlow(
  {
    name: 'plantPricingFlow',
    inputSchema: PlantPricingInputSchema,
    outputSchema: PlantPricingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
