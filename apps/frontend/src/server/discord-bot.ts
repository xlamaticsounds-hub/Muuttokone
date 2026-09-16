// src/server/discord-bot.ts
//
// A real Discord bot (persistent gateway connection via discord.js) — not
// the same thing as the plain DISCORD_WEBHOOK_URL notifications used
// elsewhere in api/submit/route.ts (newsletter signups, contact form
// messages). A webhook can only ever send a message; this one also has to
// read the 🔵/✅/❌ reaction someone adds to a lead message and update that
// lead's status (and its calendar event) accordingly, which requires an
// actual bot identity connected to Discord's gateway.
//
// startDiscordBot() is called once from instrumentation.ts when the Next.js
// server boots. Railway runs this app as a single long-lived container (see
// scripts/migrate-and-start.sh) rather than short-lived serverless
// functions, so keeping one persistent gateway connection alive for the
// server's whole lifetime is a natural fit, not a workaround.

import { Client, GatewayIntentBits, Partials, EmbedBuilder, Events, ChannelType } from 'discord.js';
import type { LeadStatus } from '@prisma/client';
import {
  setLeadStatus,
  setLeadCalendarEventId,
  findLeadByDiscordMessageId,
} from '@/server/repo/leads';
import { createLog } from '@/server/repo/logs';
import { confirmCalendarEvent, cancelCalendarEvent } from '@/server/google-calendar';

const REACTION_STATUS_MAP: Record<string, LeadStatus> = {
  '🔵': 'CONTACTED',
  '✅': 'WON',
  '❌': 'LOST',
};

const STATUS_COLOR: Record<string, number> = {
  NEW: 0x22c55e,
  CONTACTED: 0x3b82f6,
  WON: 0x8b5cf6,
  LOST: 0xef4444,
};

// Same globalThis-singleton trick as the Prisma client in server/db.ts — a
// module-level `let` would get re-initialised on every Next.js dev hot
// reload, logging a fresh client in under the same bot token each time.
const globalForBot = globalThis as unknown as { discordBotClient?: Client };

export function isDiscordBotConfigured(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_LEADS_CHANNEL_ID);
}

/**
 * Starts the bot's gateway connection. Safe to call repeatedly — later calls
 * just return the already-connected (or already-connecting) client.
 */
export function startDiscordBot(): Client | null {
  if (!isDiscordBotConfigured()) {
    console.warn('[discord-bot] DISCORD_BOT_TOKEN tai DISCORD_LEADS_CHANNEL_ID puuttuu, botti ei käynnisty.');
    return null;
  }

  if (globalForBot.discordBotClient) return globalForBot.discordBotClient;

  const client = new Client({
    // Neither of these needs a privileged intent in the Discord Developer
    // Portal — only Presence/Server Members/Message Content do, and this bot
    // reads none of those, just channel info and reactions.
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Reaction, Partials.Channel],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`[discord-bot] Kirjautunut sisään nimellä ${readyClient.user.tag}`);
    // Also visible in /hallinta/lokit, so a successful connection can be
    // confirmed without needing Railway's own console logs.
    createLog({
      entityType: 'Lead',
      entityId: 'discord-bot',
      action: 'discord.bot_ready',
      message: `Botti kirjautui sisään nimellä ${readyClient.user.tag}`,
    }).catch(() => {});
  });

  client.on(Events.MessageReactionAdd, handleReactionAdd);

  client.login(process.env.DISCORD_BOT_TOKEN).catch((error) => {
    console.error('[discord-bot] Kirjautuminen epäonnistui:', error);
    createLog({
      entityType: 'Lead',
      entityId: 'discord-bot',
      action: 'discord.bot_login.failed',
      message: error instanceof Error ? error.message : String(error),
    }).catch(() => {});
  });

  globalForBot.discordBotClient = client;
  return client;
}

async function handleReactionAdd(reaction: any, user: any) {
  try {
    if (user.bot) return;

    // Reactions on messages the client hasn't cached (e.g. after a restart)
    // arrive partial — the emoji/message data has to be fetched first.
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const rawEmoji = reaction.emoji.name as string | null;
    // Some clients send a trailing variation selector (U+FE0F) on an emoji
    // depending on how it was picked — strip it so a click on the bot's own
    // pre-added reaction always matches regardless of that.
    const emoji = rawEmoji ? rawEmoji.replace(/️/g, '') : null;

    if (!emoji || !(emoji in REACTION_STATUS_MAP)) return; // some other emoji — not ours

    const newStatus = REACTION_STATUS_MAP[emoji];
    const lead = await findLeadByDiscordMessageId(reaction.message.id);

    if (!lead) {
      // Reacted with one of our three tracked emoji, but no lead has this
      // exact discordMessageId — most likely it never got saved on the lead,
      // or this is an old/unrelated message. Log it instead of failing
      // completely silently, since this is otherwise invisible outside
      // Railway's own console output.
      await createLog({
        entityType: 'Lead',
        entityId: reaction.message.id,
        action: 'discord.reaction_no_matching_lead',
        message: `Reaktio (${emoji}) viestiin ${reaction.message.id}, mutta yhtään liidiä ei löytynyt tällä discordMessageId:llä.`,
      }).catch(() => {});
      return;
    }

    await setLeadStatus(lead.id, newStatus);
    await createLog({
      entityType: 'Lead',
      entityId: lead.id,
      action: 'lead.status_changed_via_discord',
      message: `Tila vaihdettu Discord-reaktiolla (${emoji}) käyttäjältä ${user.username ?? user.id}`,
      data: { emoji, newStatus },
    });

    if (lead.calendarEventId) {
      if (newStatus === 'WON') {
        await confirmCalendarEvent(lead.id, lead.calendarEventId);
      } else if (newStatus === 'LOST') {
        await cancelCalendarEvent(lead.id, lead.calendarEventId);
        await setLeadCalendarEventId(lead.id, null);
      }
    }

    // Reflect the new status on the message itself, so it's clear at a
    // glance which reaction "won" without hovering over the reaction list.
    const originalEmbed = reaction.message.embeds?.[0];
    if (originalEmbed) {
      try {
        const updated = EmbedBuilder.from(originalEmbed)
          .setColor(STATUS_COLOR[newStatus] ?? null)
          .setFooter({ text: `Tila: ${newStatus}` });
        await reaction.message.edit({ embeds: [updated] });
      } catch (editError) {
        console.warn('[discord-bot] Failed to edit message after status change:', editError);
      }
    }
  } catch (error) {
    // Last-resort catch for anything the branches above couldn't log
    // themselves (e.g. reaction.fetch() throwing on a permissions issue).
    // Still get it into the visible log, best-effort.
    console.error('[discord-bot] Failed to handle reaction:', error);
    try {
      await createLog({
        entityType: 'Lead',
        entityId: reaction?.message?.id ?? 'unknown',
        action: 'discord.reaction_handling.failed',
        message: error instanceof Error ? error.message : String(error),
      });
    } catch {
      // truly best-effort — don't let a logging failure mask anything further
    }
  }
}

export type LeadMessageDetails = {
  leadId: string;
  customerName: string;
  phone: string | null;
  email: string | null;
  fromAddress: string | null;
  toAddress: string | null;
  requestedDateLabel: string | null;
  sourceLabel: string;
  squareMeters: number | null;
  floor: number | null;
  hasElevator: boolean | null;
  boxCount: number | null;
  notes: string | null;
  hallintaUrl: string;
  overlapWarnings: string[];
  calendarLink: string | null;
};

/**
 * Posts a new lead to the configured Discord channel and pre-adds the three
 * status reactions. Returns the message/channel id to persist on the Lead so
 * a later reaction can be matched back to it, or null if the bot isn't
 * configured, isn't reachable, or the post otherwise fails — the caller must
 * still create the lead regardless (same rule as Calendar: never block on
 * this).
 */
export async function postLeadToDiscord(
  details: LeadMessageDetails,
): Promise<{ messageId: string; channelId: string } | null> {
  const client = startDiscordBot();
  if (!client) return null;

  try {
    await waitUntilReady(client);

    const channel = await client.channels.fetch(process.env.DISCORD_LEADS_CHANNEL_ID as string);
    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error('[discord-bot] DISCORD_LEADS_CHANNEL_ID ei osoita tekstikanavaan johon botilla on pääsy.');
      return null;
    }

    const embed = new EmbedBuilder()
      .setTitle('🚀 Uusi tarjouspyyntö')
      .setColor(STATUS_COLOR.NEW)
      .addFields(
        { name: 'Nimi', value: details.customerName || 'Ei nimeä', inline: true },
        { name: 'Puhelin', value: details.phone || 'Ei puhelinta', inline: true },
        { name: 'Sähköposti', value: details.email || 'Ei sähköpostia', inline: true },
        { name: 'Mistä', value: details.fromAddress || '-', inline: true },
        { name: 'Minne', value: details.toAddress || '-', inline: true },
        { name: 'Muuttopäivä', value: details.requestedDateLabel || '-', inline: true },
        { name: 'Tyyppi', value: details.sourceLabel, inline: true },
      );

    if (details.squareMeters) embed.addFields({ name: 'Pinta-ala', value: `${details.squareMeters} m²`, inline: true });
    if (details.floor !== null) embed.addFields({ name: 'Kerros', value: `${details.floor}`, inline: true });
    if (details.hasElevator !== null)
      embed.addFields({ name: 'Hissi', value: details.hasElevator ? 'Kyllä' : 'Ei', inline: true });
    if (details.boxCount) embed.addFields({ name: 'Laatikot', value: `${details.boxCount} kpl`, inline: true });
    if (details.notes) embed.addFields({ name: 'Lisätiedot', value: details.notes, inline: false });

    if (details.overlapWarnings.length > 0) {
      embed.addFields({
        name: '⚠️ Toinen keikka samana päivänä',
        value: details.overlapWarnings.join(', '),
        inline: false,
      });
    }

    const linkLines = [`[Avaa hallintapaneelissa](${details.hallintaUrl})`];
    if (details.calendarLink) linkLines.push(`[Kalenteritapahtuma (alustava)](${details.calendarLink})`);
    embed.setDescription(linkLines.join(' · '));
    embed.setFooter({ text: 'Tila: NEW' });

    const message = await channel.send({ embeds: [embed] });
    for (const emoji of Object.keys(REACTION_STATUS_MAP)) {
      await message.react(emoji);
    }

    return { messageId: message.id, channelId: message.channelId };
  } catch (error) {
    console.error('[discord-bot] Failed to post lead message:', error);
    try {
      await createLog({
        entityType: 'Lead',
        entityId: details.leadId,
        action: 'discord.post_lead.failed',
        message: error instanceof Error ? error.message : String(error),
      });
    } catch {
      // best effort — don't let a logging failure mask the original error
    }
    return null;
  }
}

function waitUntilReady(client: Client, timeoutMs = 15000): Promise<void> {
  if (client.isReady()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Discord-botti ei ehtinyt yhdistää ajoissa')), timeoutMs);
    client.once(Events.ClientReady, () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
