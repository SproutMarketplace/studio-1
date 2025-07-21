
'use server';
/**
 * @fileOverview An AI agent that provides international plant shipping regulations.
 *
 * - getShippingRequirements - A function that fetches compliance data for shipping a plant between two countries.
 * - ShippingRequirementsInput - The input type for the getShippingRequirements function.
 * - ShippingRequirementsOutput - The return type for the getShippingRequirements function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define Zod schema for the input
export const ShippingRequirementsInputSchema = z.object({
  fromCountry: z.string().describe('The ISO 3166-1 alpha-2 code of the origin country.'),
  toCountry: z.string().describe('The ISO 3166-1 alpha-2 code of the destination country.'),
  plantSpecies: z.string().describe('The scientific name of the plant being shipped, e.g., "Monstera deliciosa".'),
});
export type ShippingRequirementsInput = z.infer<typeof ShippingRequirementsInputSchema>;

// Define Zod schema for the structured output
export const ShippingRequirementsOutputSchema = z.object({
  summary: z.array(z.string()).describe('A bulleted list summarizing the key requirements.'),
  prohibited: z.object({
    isProhibited: z.boolean().describe('Whether shipping this plant is explicitly prohibited.'),
    reason: z.string().optional().describe('The reason for prohibition, if applicable (e.g., invasive species).'),
  }).describe('Information on whether the shipment is prohibited.'),
  phytoCertificate: z.object({
    required: z.boolean().describe('Is a Phytosanitary Certificate required?'),
    issuingBody: z.string().optional().describe("The name of the National Plant Protection Organization (NPPO) in the origin country."),
    applicationLink: z.string().url().optional().describe('A direct link to the application page.'),
    notes: z.string().optional().describe("Sprout's Best Practice Tip or other key information."),
  }).describe('Details about the Phytosanitary Certificate.'),
  citesPermit: z.object({
    isListed: z.boolean().describe('Is the plant species CITES listed?'),
    appendix: z.string().optional().describe('The CITES Appendix (e.g., "I", "II", "III"), if listed.'),
    exportPermitLink: z.string().url().optional().describe('Link to the CITES Management Authority in the origin country for an export permit.'),
    importPermitLink: z.string().url().optional().describe('Link to the CITES Management Authority in the destination country for an import permit.'),
    notes: z.string().optional().describe("Sprout's Best Practice Tip or other key information regarding CITES."),
  }).describe('Details about CITES permits.'),
  importPermit: z.object({
    required: z.boolean().describe('Is a separate Import Permit required by the destination country?'),
    issuingBody: z.string().optional().describe("Name of the relevant government agency in the destination country."),
    applicationLink: z.string().url().optional().describe('A direct link for the buyer to apply for the permit.'),
    notes: z.string().optional().describe("Sprout's Best Practice Tip for the buyer."),
  }).describe("Information on buyer-side Import Permits."),
  customs: z.object({
    guidance: z.string().describe('General guidance on customs declarations, including what to declare (scientific name, value) and links to common forms like CN22/CN23.'),
  }).describe('Information about customs declarations.'),
  packaging: z.object({
      guidance: z.string().describe('A summary of best practices for international plant shipping, including sterile media, insulation, and labeling.'),
  }).describe('Guidance on packaging and shipping.'),
  disclaimer: z.string().describe('A legal disclaimer stating this is for guidance only.'),
});
export type ShippingRequirementsOutput = z.infer<typeof ShippingRequirementsOutputSchema>;

// The exported function that calls the Genkit flow
export async function getShippingRequirements(input: ShippingRequirementsInput): Promise<ShippingRequirementsOutput> {
  return shippingGuideFlow(input);
}

// Define the Genkit prompt
const shippingGuidePrompt = ai.definePrompt({
  name: 'shippingGuidePrompt',
  input: { schema: ShippingRequirementsInputSchema },
  output: { schema: ShippingRequirementsOutputSchema },
  prompt: `You are an expert in international phytosanitary regulations and customs for shipping live plants. Your task is to provide a detailed compliance guide for a user shipping a specific plant from one country to another.

User Request:
- Shipping From: {{fromCountry}}
- Shipping To: {{toCountry}}
- Plant Species: {{plantSpecies}}

Instructions:
1.  **Analyze the Request**: Determine the general requirements for shipping live plants between the two specified countries.
2.  **CITES Check**: Check if "{{plantSpecies}}" is listed under CITES. Use your knowledge base. If it is, specify the Appendix.
3.  **Prohibited Check**: Determine if the plant is likely to be on a prohibited or noxious weed list for the destination country. If it is, set 'isProhibited' to true and provide a reason.
4.  **Fill out ALL fields** in the output JSON schema with accurate, helpful, and concise information.
5.  **Provide Real Links**: For application links, provide real, direct URLs to the official government/agency websites (e.g., USDA APHIS, Canada's CFIA, UK's DEFRA). Do not use placeholder URLs.
6.  **Provide Sprout's Best Practice Tips**: Fill in the 'notes' fields with helpful advice as if you are a helpful guide from an app called "Sprout".
7.  **Disclaimer**: Always include a disclaimer that this information is for guidance and the user is responsible for final verification with official sources.
`,
});

// Define the Genkit flow
const shippingGuideFlow = ai.defineFlow(
  {
    name: 'shippingGuideFlow',
    inputSchema: ShippingRequirementsInputSchema,
    outputSchema: ShippingRequirementsOutputSchema,
  },
  async (input) => {
    const { output } = await shippingGuidePrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid output.");
    }
    return output;
  }
);

    