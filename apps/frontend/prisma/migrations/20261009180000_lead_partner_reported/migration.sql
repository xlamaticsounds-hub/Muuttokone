-- Merkintä siitä, että muutto on lähetetty kumppanille hyväksytyssä raportissa (palkkio laskutettu).
ALTER TABLE "Lead" ADD COLUMN "partnerReportedAt" TIMESTAMP(3),
ADD COLUMN "partnerReportId" TEXT;
