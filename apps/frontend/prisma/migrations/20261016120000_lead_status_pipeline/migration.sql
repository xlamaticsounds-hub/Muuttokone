-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'INVOICED';
ALTER TYPE "LeadStatus" ADD VALUE 'PAID';

-- "Oltu yhteydessä" ja "Tarjous lähetetty" yhdistettiin yhdeksi tilaksi (PROPOSAL_SENT)
UPDATE "Lead" SET "status" = 'PROPOSAL_SENT' WHERE "status" = 'CONTACTED';
