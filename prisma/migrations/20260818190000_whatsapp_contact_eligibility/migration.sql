-- CreateEnum
CREATE TYPE "WhatsAppConsentStatus" AS ENUM ('UNKNOWN', 'OPTED_IN', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "WhatsAppConsentEventStatus" AS ENUM ('OPTED_IN', 'OPTED_OUT');

-- CreateEnum
CREATE TYPE "WhatsAppConsentSource" AS ENUM ('PHONE_CALL', 'EMAIL', 'FORM', 'INBOUND_WHATSAPP', 'OTHER');

-- CreateEnum
CREATE TYPE "WhatsAppConsentPurpose" AS ENUM ('PRESENTATION', 'DEMO', 'MEETING', 'FOLLOW_UP', 'OTHER');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "whatsappConsentStatus" "WhatsAppConsentStatus" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Lead" ADD COLUMN "phoneE164" TEXT;

-- CreateTable
CREATE TABLE "WhatsAppConsentEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "WhatsAppConsentEventStatus" NOT NULL,
    "source" "WhatsAppConsentSource" NOT NULL,
    "purpose" "WhatsAppConsentPurpose",
    "purposeNote" TEXT,
    "evidenceAt" TIMESTAMP(3) NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppConsentEvent_leadId_createdAt_idx" ON "WhatsAppConsentEvent"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppConsentEvent_actorId_idx" ON "WhatsAppConsentEvent"("actorId");

-- AddForeignKey
ALTER TABLE "WhatsAppConsentEvent" ADD CONSTRAINT "WhatsAppConsentEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConsentEvent" ADD CONSTRAINT "WhatsAppConsentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
