-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('MANUAL', 'GOOGLE_PLACES', 'REFERRAL', 'IMPORT');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "source" "LeadSource" NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Lead" ADD COLUMN "externalId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "intelligence" JSONB;

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_source_externalId_key" ON "Lead"("source", "externalId");
