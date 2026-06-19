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

  const { content, instruction } = await req.json();

  try {
    const { text } = await generateText({
      model: google('gemini-2.0-flash-lite-preview-02-05'),
      system: `You are a professional editor. Improve the following text based on the user's instruction.
      Maintain the original meaning and markdown formatting.
      Language: Finnish.`,
      prompt: `Instruction: ${instruction}

      Text:
      ${content}`,
    });

    return Response.json({ content: text });
  } catch (error) {
    console.error('[ai/polish-content] failed', error);
    return Response.json({ error: 'Sisällön parannus epäonnistui.' }, { status: 502 });
  }
}
