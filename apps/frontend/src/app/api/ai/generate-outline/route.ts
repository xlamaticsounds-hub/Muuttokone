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

  const { topic, keywords, audience, tone } = await req.json();

  try {
    const result = await generateObject({
      model: google('gemini-flash-lite-latest'),
      schema: z.object({
        title: z.string().describe('A catchy, SEO-friendly title for the blog post'),
        slug: z.string().describe('A URL-friendly slug based on the title'),
        sections: z.array(
          z.object({
            heading: z.string().describe('The section heading'),
            points: z.array(z.string()).describe('Key points to cover in this section'),
          })
        ).describe('The main sections of the blog post'),
      }),
      system: `You are an expert content strategist and blog writer for a moving company called "Muuttokone.fi".
      Your goal is to create detailed, high-quality blog post outlines.

      Context:
      - Muuttokone.fi offers moving services, comparison, and moving boxes.
      - The content should be helpful, authoritative, and SEO-optimized for the Finnish market.
      - Language: Finnish (Suomi).`,
      prompt: `Create a blog post outline about "${topic}".

      Target Audience: ${audience}
      Keywords to include: ${keywords}
      Tone: ${tone}

      The outline should be comprehensive and logical.`,
    });

    return result.toJsonResponse();
  } catch (error) {
    console.error('[ai/generate-outline] failed', error);
    return Response.json({ error: 'Jäsennyksen luonti epäonnistui.' }, { status: 502 });
  }
}
