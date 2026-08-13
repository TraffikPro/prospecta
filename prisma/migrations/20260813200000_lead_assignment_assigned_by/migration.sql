-- Additive: who performed the LeadAssignment (ADMIN actor).
-- Does not alter the prior weekly portfolio migration.

ALTER TABLE "LeadAssignment" ADD COLUMN "assignedById" TEXT;

CREATE INDEX "LeadAssignment_assignedById_idx" ON "LeadAssignment"("assignedById");

ALTER TABLE "LeadAssignment"
  ADD CONSTRAINT "LeadAssignment_assignedById_fkey"
  FOREIGN KEY ("assignedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
