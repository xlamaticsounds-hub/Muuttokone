-- AlterTable
ALTER TABLE "BoxRental" ADD COLUMN "manualCalendar" BOOLEAN NOT NULL DEFAULT false;

-- Inventaarion lähtötilanne 12.11.2026 Google-kalenterin laatikkomerkinnöistä (tarkistettu käyttäjän kanssa).
-- Vain liidien tunnisteet: rivi lisätään vain, jos liidi on tässä tietokannassa (muissa ympäristöissä ei tee mitään),
-- eikä olemassa olevaa vuokrausta korvata. manualCalendar = toimitus/nouto on jo kalenterissa käsin tehtynä.
INSERT INTO "BoxRental" (
    "id", "leadId", "quantity", "deliveryDate", "pickupDate", "datesEstimated", "status",
    "returnedQty", "lostQty", "notes", "manualCalendar", "createdAt", "updatedAt"
)
SELECT
    'boximport_' || v.lead_id, v.lead_id, v.qty, v.delivery::timestamp, v.pickup::timestamp, v.estimated,
    v.status::"BoxRentalStatus", v.returned, 0, v.notes, v.manual, NOW(), NOW()
FROM (VALUES
    -- Asiakkailla nyt (115 kpl)
    ('cmval0nsj000301o6mg4jawl4', 50, '2026-10-31', '2026-11-14', true,  'DELIVERED', NULL::integer, NULL::text, false),
    ('cmvdi1cbd001x01qqpk57dlvj', 40, '2026-11-06', '2026-11-20', false, 'DELIVERED', NULL, NULL, true),
    ('cmvsf1yub001k01s1zs8gyco1', 25, '2026-11-11', '2026-11-16', false, 'DELIVERED', NULL, NULL, true),
    -- Tulossa (180 kpl)
    ('cmvkxxa5s000t01mplindwzk1', 35, '2026-11-13', '2026-11-27', false, 'RESERVED', NULL, NULL, true),
    ('cmw1v3jiq000d01mnhr4tivf4', 50, '2026-11-16', '2026-12-02', false, 'RESERVED', NULL, NULL, false),
    ('cmw3ape55000c01lo3c5ulbkq', 40, '2026-12-07', '2026-12-21', true,  'RESERVED', NULL, 'Noutopäivä on arvio (ei kalenterissa).', true),
    ('cmw35wnr7000201lofi93oayq', 20, '2026-12-09', '2026-12-13', false, 'RESERVED', NULL, NULL, false),
    ('cmvm6j0dw000101s1ud57w2y8', 35, '2026-12-09', '2026-12-23', false, 'RESERVED', NULL, NULL, true),
    -- Jo noudettu
    ('cmw84bxam001301loanxgyo07', 21, '2026-11-01', '2026-11-12', false, 'RETURNED', 21, 'Tuotu kalenterista: noudettu, noutopäivä ei tiedossa.', false),
    -- Kaksoisliidit: sama vuokraus on toisella liidillä, ettei se laskeudu kahteen kertaan
    ('cmvi7woe2006901qq4kk1nj7r', 35, '2026-12-09', '2026-12-23', false, 'CANCELLED', NULL, 'Kaksoisliidi: laatikkovuokra on liidillä cmvm6j0dw000101s1ud57w2y8.', false),
    ('cmw3gn4bd000o01loyv622c86', 21, '2026-11-01', '2026-11-12', false, 'CANCELLED', NULL, 'Kaksoisliidi: laatikkovuokra on liidillä cmw84bxam001301loanxgyo07.', false)
) AS v(lead_id, qty, delivery, pickup, estimated, status, returned, notes, manual)
JOIN "Lead" l ON l."id" = v.lead_id
-- Lomakkeelta automaattisesti luotu arvio (ei vielä kenenkään muokkaama) korvataan kalenterin tiedoilla;
-- hallinnassa jo muokattuun tai kuitattuun vuokraukseen ei kosketa.
ON CONFLICT ("leadId") DO UPDATE SET
    "quantity" = EXCLUDED."quantity",
    "deliveryDate" = EXCLUDED."deliveryDate",
    "pickupDate" = EXCLUDED."pickupDate",
    "datesEstimated" = EXCLUDED."datesEstimated",
    "status" = EXCLUDED."status",
    "returnedQty" = EXCLUDED."returnedQty",
    "notes" = EXCLUDED."notes",
    "manualCalendar" = EXCLUDED."manualCalendar",
    "updatedAt" = NOW()
WHERE "BoxRental"."status" = 'RESERVED' AND "BoxRental"."datesEstimated" = true AND "BoxRental"."notes" IS NULL;

-- Varaston koko: asiakkailla 115 + hyllyssä noin 40 = 155 (muutettavissa Inventaario-sivulla).
-- Vain tuotannon tietokantaan, jossa yllä olevat liidit ovat.
INSERT INTO "AppState" ("key", "value", "updatedAt")
SELECT 'boxInventory', '{"total": 155}'::jsonb, NOW()
WHERE EXISTS (SELECT 1 FROM "Lead" WHERE "id" = 'cmvdi1cbd001x01qqpk57dlvj')
ON CONFLICT ("key") DO NOTHING;
