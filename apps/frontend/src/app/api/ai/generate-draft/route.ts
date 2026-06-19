import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      { error: 'AI-palvelu ei ole määritetty (GOOGLE_GENERATIVE_AI_API_KEY puuttuu).' },
      { status: 503 },
    );
  }

  const { outline, tone, audience } = await req.json();

  const prompt = `
  Write a full blog post in Finnish based on the following outline.

  Title: ${outline.title}

  Sections:
  ${outline.sections.map((s: any) => `- ${s.heading}\n  ${s.points.map((p: any) => `  * ${p}`).join('\n')}`).join('\n')}

  Audience: ${audience}
  Tone: ${tone}

  Instructions:
  - Write in valid Markdown format.
  - Use H2 (##) for section headings.
  - Use H3 (###) for sub-points if necessary.
  - The content should be engaging, informative, and high-quality.
  - Include a short introduction and a conclusion.
  - Do NOT include the title in the body (it will be handled separately).
  `;

  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash-lite-preview-02-05'),
      system: `You are a professional copywriter for Muuttokone.fi. You write clear, engaging, and SEO-friendly content in Finnish.`,
      prompt: prompt,
    });

    return Response.json({ content: text });
  } catch (error) {
    console.error('[ai/generate-draft] failed', error);
    return Response.json({ error: 'Sisällön luonti epäonnistui.' }, { status: 502 });
  }
}

