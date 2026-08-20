import type { WhatsAppConsentEventStatus, WhatsAppConsentStatus } from "@prisma/client";

export function parseEvidenceAt(value: string): Date {
  return new Date(value);
}

/** After OPTED_OUT, a new OPTED_IN must use a later evidenceAt. */
export function requiresNewerEvidenceAfterOptOut(input: {
  nextStatus: WhatsAppConsentEventStatus;
  currentStatus: WhatsAppConsentStatus;
  nextEvidenceAt: Date;
  previousEvidenceAt: Date | null;
}): boolean {
  if (input.currentStatus !== "OPTED_OUT") {
    return false;
  }
  if (input.nextStatus !== "OPTED_IN") {
    return false;
  }
  if (!input.previousEvidenceAt) {
    return false;
  }
  return input.nextEvidenceAt.getTime() <= input.previousEvidenceAt.getTime();
}
