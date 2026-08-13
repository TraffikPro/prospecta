-- CreateEnum
CREATE TYPE "LeadAssignmentSource" AS ENUM ('ENROLL_OWNED', 'MANUAL_ADMIN', 'NEW_ACQUISITION', 'RECYCLED');

-- CreateEnum
CREATE TYPE "LeadAssignmentStatus" AS ENUM ('ACTIVE', 'TREATED', 'RELEASED');

-- CreateTable
CREATE TABLE "OperatorWeeklyQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyTarget" INTEGER NOT NULL DEFAULT 10,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorWeeklyQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPortfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartAt" TIMESTAMP(3) NOT NULL,
    "weekEndAt" TIMESTAMP(3) NOT NULL,
    "targetSnapshot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "weekStartAt" TIMESTAMP(3) NOT NULL,
    "source" "LeadAssignmentSource" NOT NULL,
    "status" "LeadAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "treatedAt" TIMESTAMP(3),
    "treatedActivityId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "releaseReason" TEXT,
    "previousAssigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorWeeklyQuota_userId_key" ON "OperatorWeeklyQuota"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPortfolio_userId_weekStartAt_key" ON "WeeklyPortfolio"("userId", "weekStartAt");

-- CreateIndex
CREATE INDEX "WeeklyPortfolio_weekStartAt_idx" ON "WeeklyPortfolio"("weekStartAt");

-- CreateIndex
CREATE INDEX "LeadAssignment_assigneeId_weekStartAt_status_idx" ON "LeadAssignment"("assigneeId", "weekStartAt", "status");

-- CreateIndex
CREATE INDEX "LeadAssignment_leadId_status_idx" ON "LeadAssignment"("leadId", "status");

-- CreateIndex
CREATE INDEX "LeadAssignment_portfolioId_idx" ON "LeadAssignment"("portfolioId");

CREATE INDEX "OperatorWeeklyQuota_updatedById_idx" ON "OperatorWeeklyQuota"("updatedById");

CREATE INDEX "LeadAssignment_treatedActivityId_idx" ON "LeadAssignment"("treatedActivityId");

-- Partial unique: one ACTIVE assignment per lead
CREATE UNIQUE INDEX "LeadAssignment_active_lead_key" ON "LeadAssignment"("leadId") WHERE "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "OperatorWeeklyQuota" ADD CONSTRAINT "OperatorWeeklyQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorWeeklyQuota" ADD CONSTRAINT "OperatorWeeklyQuota_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPortfolio" ADD CONSTRAINT "WeeklyPortfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "WeeklyPortfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_treatedActivityId_fkey" FOREIGN KEY ("treatedActivityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_previousAssigneeId_fkey" FOREIGN KEY ("previousAssigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
