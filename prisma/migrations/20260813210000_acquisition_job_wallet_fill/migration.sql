-- F3 wallet fill: distinguish Completar carteira from ADMIN free pull.
-- requestedById already exists; this adds purpose + slot result fields.

CREATE TYPE "AcquisitionJobPurpose" AS ENUM ('FREE_PULL', 'WALLET_FILL');

ALTER TABLE "AcquisitionJob" ADD COLUMN "purpose" "AcquisitionJobPurpose" NOT NULL DEFAULT 'FREE_PULL';
ALTER TABLE "AcquisitionJob" ADD COLUMN "requestedSlots" INTEGER;
ALTER TABLE "AcquisitionJob" ADD COLUMN "assignedCount" INTEGER;

CREATE INDEX "AcquisitionJob_requestedById_purpose_status_idx" ON "AcquisitionJob"("requestedById", "purpose", "status");
