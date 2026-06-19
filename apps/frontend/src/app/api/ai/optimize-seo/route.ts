import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: 'AI-palvelu ei ole määritetty (GOOGLE_GENERATIVE_AI_API_KEY puuttuu).' },
      { status: 503 },
    );
  }

  const { content } = await req.json();

  try {
    const result = await generateObject({
      model: google('gemini-flash-lite-latest'),
      schema: z.object({
        metaTitle: z.string().describe('SEO optimized title, max 60 characters'),
        metaDescription: z.string().describe('SEO optimized description, max 160 characters'),
      }),
      system: `You are an SEO expert. optimize the metadata for the following blog post content.
      The title should be catchy and include main keywords.
      The description should encourage clicks.
      Language: Finnish.`,
      prompt: `Content: ${content.substring(0, 5000)}...`, // Limit context to save tokens
    });

    return result.toJsonResponse();
  } catch (error) {
    console.error('[ai/optimize-seo] failed', error);
    return Response.json({ error: 'SEO-optimointi epäonnistui.' }, { status: 502 });
  }
}
