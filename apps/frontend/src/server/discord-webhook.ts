// Yksinkertainen ilmoitus DISCORD_WEBHOOK_URL-kanavalle (ei vaadi bottia, toisin kuin
// discord-bot.ts). Ei koskaan heitä — ilmoituksen epäonnistuminen ei saa kaataa kutsujaa.
export type DiscordField = { name: string; value: string; inline?: boolean };

export async function sendDiscordNotification(title: string, fields: DiscordField[]): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not defined. Skipping notification.');
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: title,
            color: 5814783, // #58b9ff (Primary Blue-ish)
            fields: fields,
            timestamp: new Date().toISOString(),
            footer: {
              text: 'Muuttokone Lead System',
            },
          },
        ],
      }),
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}
