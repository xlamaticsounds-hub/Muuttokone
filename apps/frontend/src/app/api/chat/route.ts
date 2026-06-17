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

      Hinnoittelumme perustuu asiakkaan ilmoittamaan tavaralistaan, ei pelkkään asunnon kokoon — kaksi samankokoista asuntoa voivat saada eri hinnan tavaramäärän, kerrosten, hissien ja kantomatkan mukaan. Ensimmäiset 5 km sisältyvät hintaan ja tämän jälkeen kilometrit veloitetaan 0,79 €/km.
      Muuttopäivä voi myös tuoda alennusta: hiljaisemmat päivät (esim. tiistai ja keskiviikko) ovat edullisempia kuin suositut päivät (perjantai-sunnuntai). Emme koskaan lisää viikonloppulisää tai korota hintaa päivän perusteella, vain alennamme hiljaisempina päivinä.
      Meillä on käytössä Suomen tarkin muuttolaskuri, jolla saa tarkan hinta-arvion lisäämällä muutettavat tavarat listaan.

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
