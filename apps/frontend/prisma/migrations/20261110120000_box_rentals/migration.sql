-- CreateEnum
CREATE TYPE "BoxRentalStatus" AS ENUM ('RESERVED', 'DELIVERED', 'RETURNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BoxRental" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "datesEstimated" BOOLEAN NOT NULL DEFAULT true,
    "status" "BoxRentalStatus" NOT NULL DEFAULT 'RESERVED',
    "returnedQty" INTEGER,
    "lostQty" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "deliveryEventId" TEXT,
    "pickupEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoxRental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoxRental_leadId_key" ON "BoxRental"("leadId");

-- CreateIndex
CREATE INDEX "BoxRental_status_idx" ON "BoxRental"("status");

-- CreateIndex
CREATE INDEX "BoxRental_deliveryDate_idx" ON "BoxRental"("deliveryDate");

-- CreateIndex
CREATE INDEX "BoxRental_pickupDate_idx" ON "BoxRental"("pickupDate");

-- AddForeignKey
ALTER TABLE "BoxRental" ADD CONSTRAINT "BoxRental_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
