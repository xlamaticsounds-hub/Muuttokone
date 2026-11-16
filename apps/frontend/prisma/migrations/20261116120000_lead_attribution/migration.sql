-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "attribution" JSONB,
ADD COLUMN     "trafficSource" TEXT;

-- CreateIndex
CREATE INDEX "Lead_trafficSource_idx" ON "Lead"("trafficSource");
