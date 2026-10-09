-- CreateEnum
CREATE TYPE "PartnerReportStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateTable
CREATE TABLE "PartnerSettings" (
    "id" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "reportEmail" TEXT,
    "reportCcEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerReport" (
    "id" TEXT NOT NULL,
    "partner" TEXT NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "status" "PartnerReportStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "previewSentAt" TIMESTAMP(3),
    "previewSentTo" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT,
    "sentCc" TEXT,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerSettings_partner_key" ON "PartnerSettings"("partner");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerReport_partner_periodYear_periodMonth_key" ON "PartnerReport"("partner", "periodYear", "periodMonth");
