import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { rateLimit, logAction } from '@/server/rate-limit';
import { headers } from 'next/headers';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  try {
    // 1. Rate Limiting (10 messages per 15 mins)
    await rateLimit(ip, 'api.chat', 10, 15);

    const { messages }: { messages: UIMessage[] } = await req.json();

    // 2. Input Validation (Basic)
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid input', { status: 400 });
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `Olet Muuttokone.fi -palvelun avustaja. Tehtäväsi on auttaa asiakkaita muuttoon liittyvissä kysymyksissä. 
      Voit kertoa palveluistamme:
      - Kotimuutot
      - Yritysmuutot
      - Pakkauspalvelu
      - Muuttosiivous
      
      Hinnoittelumme perustuu kilometriveloitukseen (0.59€/km) ja tuntihintaan (alk. 100-120€/h). 
      Meillä on käytössä muuttolaskuri, jolla saa tarkan hinta-arvion.
      
      Ole ystävällinen, asiantunteva ja avulias. Vastaa suomeksi.`,
      messages: await convertToModelMessages(messages),
    });

    // 3. Log the action
    await logAction(ip, 'api.chat', 'Chat message sent', 'Chat', 'global');

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    return new Response(error.message || 'Internal Server Error', { status: 429 });
  }
}
