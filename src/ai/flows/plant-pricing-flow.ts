
'use server';
/**
 * @fileOverview An AI agent that provides pricing insights for plants, fungi, and mycology supplies.
 *
 * - getPlantPricingInsights - A function that returns average sales data for an item.
 * - PlantPricingInput - The input type for the function.
 * - PlantPricingOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlantPricingInputSchema = z.object({
  plantName: z
    .string()
    .describe(
      "The common or scientific name of the plant, fungus, or mycology item to get pricing data for."
    ),
  size: z.string().optional().describe("The size of the item (e.g., Small, Medium, Large, Cutting, Seedling, Culture Plate, Spore Syringe)."),
  age: z.string().optional().describe("The age of the item (e.g., Seedling, Young, Mature, Mycelium)."),
  condition: z.string().optional().describe("The condition of the item (e.g., Pristine, Good, Fair, Contaminated)."),
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
  prompt: `You are a market data analyst for a large online marketplace for plants, fungi, and mycology supplies. Your role is to provide sellers with pricing insights based on historical sales data.

Given an item name, and optionally its size, age, and condition, you must return the average selling price for that item over various time periods. The prices should be realistic for the item specified, reflecting its potential rarity, demand, and physical attributes.

A larger, more mature plant or a rare fungal culture in pristine condition should have a higher price than a smaller, younger one or a cutting, or one in fair condition. Mycology supplies should be priced based on their typical market value.

The values should fluctuate reasonably across the time periods. For example, a popular item might see a slight price increase recently, while a common item's price might be stable or slightly lower.

Item to analyze: {{{plantName}}}
{{#if size}}Size: {{{size}}}{{/if}}
{{#if age}}Age: {{{age}}}{{/if}}
{{#if condition}}Condition: {{{condition}}}{{/if}}
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
