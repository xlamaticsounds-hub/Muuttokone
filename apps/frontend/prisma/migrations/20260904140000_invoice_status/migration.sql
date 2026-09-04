-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill: laskut joilla on jo sentAt-aikaleima olivat lähetettyjä ennen tätä saraketta.
UPDATE "Invoice" SET "status" = 'SENT' WHERE "sentAt" IS NOT NULL;
