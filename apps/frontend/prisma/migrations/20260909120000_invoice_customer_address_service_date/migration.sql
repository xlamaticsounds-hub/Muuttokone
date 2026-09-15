-- AlterTable
ALTER TABLE "Invoice"
ADD COLUMN "customerStreet" TEXT,
ADD COLUMN "customerPostalCode" TEXT,
ADD COLUMN "customerCity" TEXT,
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "serviceDate" TIMESTAMP(3);
