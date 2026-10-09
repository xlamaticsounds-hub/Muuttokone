-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "LeadStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "commissionPercent" DOUBLE PRECISION,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountCodeId" TEXT,
ADD COLUMN     "discountPercent" DOUBLE PRECISION,
ADD COLUMN     "finalPrice" DOUBLE PRECISION,
ADD COLUMN     "priceAfterDiscount" DOUBLE PRECISION,
ADD COLUMN     "priceBeforeDiscount" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "office" TEXT,
    "agentName" TEXT,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "commissionPercent" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE INDEX "Lead_discountCodeId_idx" ON "Lead"("discountCodeId");

-- CreateIndex
CREATE INDEX "Lead_completedAt_idx" ON "Lead"("completedAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Kiinteistömaailman yhteinen koodi (toimipaikka-/välittäjäkohtaiset lisätään hallintapaneelista)
INSERT INTO "DiscountCode" ("id", "code", "partner", "discountPercent", "commissionPercent", "active", "updatedAt")
VALUES ('dc_kiinteistomaailma', 'KIINTEISTOMAAILMA', 'Kiinteistömaailma', 10, 5, true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
