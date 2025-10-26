
'use server';
/**
 * @fileOverview A face verification AI agent.
 *
 * - verifyFace - A function that handles the face verification process.
 * - VerifyFaceInput - The input type for the verifyFace function.
 * - VerifyFaceOutput - The return type for the verifyFace function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyFaceInputSchema = z.object({
  faceImage1DataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  faceImage2DataUri: z
    .string()
    .describe(
      "A second photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifyFaceInput = z.infer<typeof VerifyFaceInputSchema>;

const VerifyFaceOutputSchema = z.object({
  isSamePerson: z.boolean().describe('Whether or not the two faces belong to the same person.'),
  confidence: z.number().describe('A confidence score between 0 and 1 on the match.'),
  reason: z.string().describe('A brief explanation for the decision.'),
});
export type VerifyFaceOutput = z.infer<typeof VerifyFaceOutputSchema>;

export async function verifyFace(input: VerifyFaceInput): Promise<VerifyFaceOutput> {
  return verifyFaceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyFacePrompt',
  input: {schema: VerifyFaceInputSchema},
  output: {schema: VerifyFaceOutputSchema},
  prompt: `You are an advanced AI face verification system. Your task is to compare two images and determine if they show the same person.

Analyze the facial features in both images provided. Based on your analysis, determine if it's the same person.

Provide a confidence score for your assessment. A score of 1 means you are certain they are the same person, and 0 means you are certain they are not.

If the confidence is below 0.6, set isSamePerson to false. It's okay to have some false positives.

Image 1: {{media url=faceImage1DataUri}}
Image 2: {{media url=faceImage2DataUri}}`,
});

const verifyFaceFlow = ai.defineFlow(
  {
    name: 'verifyFaceFlow',
    inputSchema: VerifyFaceInputSchema,
    outputSchema: VerifyFaceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
