CREATE TYPE "LeadAIAnalysisStatus" AS ENUM ('RUNNING', 'COMPLETE', 'INCONCLUSIVE', 'FAILED');
CREATE TABLE "LeadAIAnalysis" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "status" "LeadAIAnalysisStatus" NOT NULL DEFAULT 'RUNNING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "report" JSONB,
    "errorCode" TEXT,
    "analysisRunId" TEXT,
    "agentVersion" TEXT,
    "model" TEXT,
    "steps" INTEGER,
    "toolCalls" INTEGER,
    "tokens" INTEGER,
    "estimatedCostMicros" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LeadAIAnalysis_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LeadAIAnalysis_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadAIAnalysis_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LeadAIAnalysis_analysisRunId_key" ON "LeadAIAnalysis"("analysisRunId");
CREATE UNIQUE INDEX "LeadAIAnalysis_requestedById_requestKey_key" ON "LeadAIAnalysis"("requestedById", "requestKey");
CREATE INDEX "LeadAIAnalysis_leadId_createdAt_idx" ON "LeadAIAnalysis"("leadId", "createdAt");
CREATE INDEX "LeadAIAnalysis_status_expiresAt_idx" ON "LeadAIAnalysis"("status", "expiresAt");
CREATE UNIQUE INDEX "LeadAIAnalysis_running_lead_key" ON "LeadAIAnalysis"("leadId") WHERE "status" = 'RUNNING';
