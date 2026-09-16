-- AlterTable
ALTER TABLE "Lead"
ADD COLUMN "discordMessageId" TEXT,
ADD COLUMN "discordChannelId" TEXT,
ADD COLUMN "calendarEventId" TEXT;
