// src/ai/flows/plant-match-from-photo.ts
'use server';

/**
 * @fileOverview An AI agent that finds similar plants from a photo.
 *
 * - plantMatchFromPhoto - A function that handles the plant matching process.
 * - PlantMatchFromPhotoInput - The input type for the plantMatchFromPhoto function.
 * - PlantMatchFromPhotoOutput - The return type for the plantMatchFromPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlantMatchFromPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'      
    ),
  numberOfMatches: z
    .number()
    .default(3)
    .describe('The number of matching plants to return.'),
});
export type PlantMatchFromPhotoInput = z.infer<typeof PlantMatchFromPhotoInputSchema>;

const PlantMatchFromPhotoOutputSchema = z.object({
  matches: z
    .array(z.string())
    .describe('A list of plants that visually match the photo.'),
});
export type PlantMatchFromPhotoOutput = z.infer<typeof PlantMatchFromPhotoOutputSchema>;

export async function plantMatchFromPhoto(input: PlantMatchFromPhotoInput): Promise<PlantMatchFromPhotoOutput> {
  return plantMatchFromPhotoFlow(input);
}

const plantMatchFromPhotoPrompt = ai.definePrompt({
  name: 'plantMatchFromPhotoPrompt',
  input: {schema: PlantMatchFromPhotoInputSchema},
  output: {schema: PlantMatchFromPhotoOutputSchema},
  prompt: `You are an expert botanist. Given the following photo of a plant, find {{numberOfMatches}} visually similar plants that are available on the marketplace.

  Return the common names of the plants.
  Photo: {{media url=photoDataUri}}`,
});

const plantMatchFromPhotoFlow = ai.defineFlow(
  {
    name: 'plantMatchFromPhotoFlow',
    inputSchema: PlantMatchFromPhotoInputSchema,
    outputSchema: PlantMatchFromPhotoOutputSchema,
  },
  async input => {
    const {output} = await plantMatchFromPhotoPrompt(input);
    return output!;
  }
);
