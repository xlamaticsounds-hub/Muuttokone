-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'TEAM_ADMIN', 'CREW_LEAD');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "workerIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "teamId" TEXT,
    "passwordHash" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");

-- CreateIndex
CREATE INDEX "Worker_teamId_idx" ON "Worker"("teamId");

-- CreateIndex
CREATE INDEX "Lead_teamId_idx" ON "Lead"("teamId");

-- CreateIndex
CREATE INDEX "TimeEntry_teamId_idx" ON "TimeEntry"("teamId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Tiimit: tunnisteisiin viitataan koodissa (src/lib/teams.ts).
INSERT INTO "Team" ("id", "name", "createdAt", "updatedAt") VALUES
    ('helsinki', 'Helsinki', NOW(), NOW()),
    ('tampere', 'Tampere', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Kaikki tähänastiset keikat ja työaikaleimat ovat Helsingin tiimin tekemiä. Tampereen partiolle
-- siirretään tarvittaessa käsin liidin sivulta; uudet liidit saavat tiimin osoitteiden perusteella.
UPDATE "Lead" SET "teamId" = 'helsinki' WHERE "teamId" IS NULL;
UPDATE "TimeEntry" SET "teamId" = 'helsinki' WHERE "teamId" IS NULL;

-- Omistajat (aiemmin kovakoodattu sallittujen lista src/server/auth.ts:ssä). Ei salasanaa: kirjautuminen
-- yhteisellä hätäavaimella (ADMIN_LOGIN_PASSWORD) tai Googlella, oma salasana asetetaan /hallinta/salasana.
INSERT INTO "User" ("id", "email", "name", "role", "mustChangePassword", "active", "createdBy", "createdAt", "updatedAt") VALUES
    ('owner_domenic', 'domenic.eklund@gmail.com', 'Domenic Eklund', 'OWNER', false, true, 'migraatio', NOW(), NOW()),
    ('owner_xlamatic', 'xlamaticsounds@gmail.com', 'Domenic (xlamaticsounds)', 'OWNER', false, true, 'migraatio', NOW(), NOW()),
    ('owner_paavo', 'paavo.penttinen@proton.me', 'Paavo', 'OWNER', false, true, 'migraatio', NOW(), NOW()),
    ('owner_matias', 'matias.typpo@gmail.com', 'Matias', 'OWNER', false, true, 'migraatio', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
