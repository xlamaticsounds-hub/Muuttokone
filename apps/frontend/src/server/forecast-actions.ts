'use server';

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth';
import { setAppState } from '@/server/app-state';
import { loadBookedJobs } from '@/server/forecast-data';
import { summarizeBookedJobs } from '@/lib/forecast';
import { forecastTips } from '@/lib/forecast-tips';
import {
  FORECAST_AI_STATE_KEY,
  FORECAST_AI_SYSTEM_PROMPT,
  buildForecastAiPrompt,
  forecastFingerprint,
  formatGeneratedAt,
  type ForecastAiResult,
} from '@/lib/forecast-ai';
import { toHelsinkiDateInput } from '@/lib/helsinki-time';

export type ForecastAiActionResult = { success: true; result: ForecastAiResult; generatedLabel: string } | { success: false; message: string };

/** "Pyydä AI-vinkit" Ennuste-sivulla: malli saa vain summat ja päivät, tulos tallennetaan AppStateen. */
export async function generateForecastAiTips(): Promise<ForecastAiActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, message: 'Kirjaudu uudelleen sisään.' };
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { success: false, message: 'AI-palvelua ei ole määritetty (GOOGLE_GENERATIVE_AI_API_KEY puuttuu).' };
  }

  const todayKey = toHelsinkiDateInput(new Date());
  let forecast;
  try {
    forecast = summarizeBookedJobs(await loadBookedJobs(), todayKey);
  } catch (error) {
    console.error('[generateForecastAiTips] Keikkojen haku epäonnistui', error);
    return { success: false, message: 'Keikkoja ei saatu haettua tietokannasta.' };
  }

  try {
    const { object } = await generateObject({
      model: google('gemini-flash-latest'),
      schema: z.object({
        summary: z.string().describe('1–2 lauseen yhteenveto tulevien keikkojen tilanteesta'),
        tips: z
          .array(
            z.object({
              title: z.string().describe('Vinkki lyhyesti, esim. "Täytä viikko 47"'),
              detail: z.string().describe('1–2 lausetta: miksi ja mitä tehdä, annettuihin lukuihin perustuen'),
            }),
          )
          .describe('3–5 vinkkiä tärkein ensin'),
      }),
      system: FORECAST_AI_SYSTEM_PROMPT,
      prompt: buildForecastAiPrompt(forecast, forecastTips(forecast, todayKey), todayKey),
    });

    const result: ForecastAiResult = {
      generatedAt: new Date().toISOString(),
      fingerprint: forecastFingerprint(forecast),
      summary: object.summary.trim(),
      tips: object.tips
        .slice(0, 5)
        .map((tip) => ({ title: tip.title.trim(), detail: tip.detail.trim() }))
        .filter((tip) => tip.title),
    };
    await setAppState(FORECAST_AI_STATE_KEY, result);
    return { success: true, result, generatedLabel: formatGeneratedAt(result.generatedAt) };
  } catch (error) {
    console.error('[generateForecastAiTips] AI-vinkit epäonnistuivat', error);
    return { success: false, message: 'AI-vinkkien teko epäonnistui. Yritä uudelleen.' };
  }
}
