-- Kumppani, toimipaikka ja välittäjä varaushetken arvoina (kuten prosentit), jotta koodin
-- myöhempi muokkaus ei muuta jo tehtyjä kauppoja eikä kuukausiraportteja.
ALTER TABLE "Lead" ADD COLUMN "discountPartner" TEXT,
ADD COLUMN "discountOffice" TEXT,
ADD COLUMN "discountAgentName" TEXT;

-- Olemassa olevat koodilla tehdyt liidit (jos niitä ehti syntyä): täydennetään koodin tiedoista.
UPDATE "Lead" l
SET "discountPartner" = d."partner",
    "discountOffice" = d."office",
    "discountAgentName" = d."agentName"
FROM "DiscountCode" d
WHERE l."discountCodeId" = d."id" AND l."discountPartner" IS NULL;
