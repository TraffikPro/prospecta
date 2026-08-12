-- AcquisitionJob: ADMIN-triggered pull via external Places runner (ADR 0014)

CREATE TYPE "AcquisitionJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "AcquisitionJob" (
    "id" TEXT NOT NULL,
    "status" "AcquisitionJobStatus" NOT NULL DEFAULT 'QUEUED',
    "city" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    "campaign" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "timeoutAt" TIMESTAMP(3) NOT NULL,
    "foundCount" INTEGER,
    "qualifiedCount" INTEGER,
    "createdTotal" INTEGER,
    "createdHigh" INTEGER,
    "existingCount" INTEGER,
    "failedCount" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AcquisitionJob_status_idx" ON "AcquisitionJob"("status");
CREATE INDEX "AcquisitionJob_fingerprint_status_idx" ON "AcquisitionJob"("fingerprint", "status");
CREATE INDEX "AcquisitionJob_requestedAt_idx" ON "AcquisitionJob"("requestedAt");
CREATE INDEX "AcquisitionJob_requestedById_idx" ON "AcquisitionJob"("requestedById");

ALTER TABLE "AcquisitionJob" ADD CONSTRAINT "AcquisitionJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
