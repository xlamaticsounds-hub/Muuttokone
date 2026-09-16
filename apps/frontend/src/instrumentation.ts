// src/instrumentation.ts
//
// Next.js calls register() once when the server process starts, before it
// serves any request — the supported place to kick off a long-lived
// connection like the Discord bot's gateway login (rather than starting it
// lazily on the first lead, which would make that first request slow while
// it waits to connect). See server/discord-bot.ts for why this feature
// needs a real bot and not just the plain webhook used for other
// notifications.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startDiscordBot } = await import('@/server/discord-bot');
    startDiscordBot();
  }
}
