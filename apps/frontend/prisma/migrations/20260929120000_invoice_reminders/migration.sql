-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'SUPERSEDED';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "sourceInvoiceId" TEXT;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_sourceInvoiceId_fkey" FOREIGN KEY ("sourceInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
