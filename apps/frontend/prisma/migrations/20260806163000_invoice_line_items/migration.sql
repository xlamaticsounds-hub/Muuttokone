-- AlterTable: replace single description/amount/vatRate with a line-item array,
-- backfilling any existing rows into a one-item array before dropping the old columns.
ALTER TABLE "Invoice" ADD COLUMN "items" JSONB;

UPDATE "Invoice"
SET "items" = jsonb_build_array(
  jsonb_build_object('description', "description", 'amount', "amount", 'vatRate', "vatRate")
)
WHERE "items" IS NULL;

ALTER TABLE "Invoice" ALTER COLUMN "items" SET NOT NULL;

ALTER TABLE "Invoice" DROP COLUMN "description";
ALTER TABLE "Invoice" DROP COLUMN "amount";
ALTER TABLE "Invoice" DROP COLUMN "vatRate";
