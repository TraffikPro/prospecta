import type {
  WhatsAppConsentPurpose,
  WhatsAppConsentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LeadNotFoundError } from "@/features/activities/activity.errors";
import { WhatsAppConsentValidationError } from "@/features/whatsapp-consent/consent.errors";
import { parseEvidenceAt, requiresNewerEvidenceAfterOptOut } from "@/features/whatsapp-consent/consent.rules";
import { recordWhatsAppConsentSchema } from "@/features/whatsapp-consent/consent.schema";
import { isValidPhoneE164 } from "@/features/whatsapp-consent/phone-e164";
import { assertCanAccessLead } from "@/server/auth/lead-access";
import type { UserRole } from "@/server/auth/types";
import {
  applyWhatsAppConsentState,
  createWhatsAppConsentEvent,
  findLatestWhatsAppConsentEvent,
  listWhatsAppConsentEventsByLeadId,
  type WhatsAppConsentEventWithActor,
} from "@/server/repositories/whatsapp-consent.repository";

export type RecordWhatsAppConsentCommand = {
  leadId: string;
  actorId: string;
  status: string;
  source: string;
  purpose?: string;
  purposeNote?: string;
  evidenceAt: string;
  phoneE164?: string;
};

export async function listWhatsAppConsentForLead(
  leadId: string,
): Promise<WhatsAppConsentEventWithActor[]> {
  return listWhatsAppConsentEventsByLeadId(leadId);
}

export async function recordWhatsAppConsent(
  input: RecordWhatsAppConsentCommand,
): Promise<{ leadId: string; status: WhatsAppConsentStatus }> {
  const parsed = recordWhatsAppConsentSchema.safeParse({
    leadId: input.leadId,
    status: input.status,
    source: input.source,
    purpose: input.purpose,
    purposeNote: input.purposeNote,
    evidenceAt: input.evidenceAt,
    phoneE164: input.phoneE164,
  });

  if (!parsed.success) {
    throw new WhatsAppConsentValidationError(
      parsed.error.issues[0]?.message ?? "Dados de consentimento inválidos",
    );
  }

  const actor = await prisma.user.findFirst({
    where: { id: input.actorId, isActive: true },
    select: { id: true, role: true },
  });
  if (!actor) {
    throw new WhatsAppConsentValidationError("Autor inválido ou inativo");
  }

  const evidenceAt = parseEvidenceAt(parsed.data.evidenceAt);

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: { id: parsed.data.leadId },
      select: {
        id: true,
        ownerId: true,
        whatsappConsentStatus: true,
        phoneE164: true,
      },
    });
    if (!lead) {
      throw new LeadNotFoundError(parsed.data.leadId);
    }

    assertCanAccessLead(lead, {
      id: actor.id,
      role: actor.role as UserRole,
    });

    const previous = await findLatestWhatsAppConsentEvent(lead.id, tx);
    if (
      requiresNewerEvidenceAfterOptOut({
        nextStatus: parsed.data.status,
        currentStatus: lead.whatsappConsentStatus,
        nextEvidenceAt: evidenceAt,
        previousEvidenceAt: previous?.evidenceAt ?? null,
      })
    ) {
      throw new WhatsAppConsentValidationError(
        "Informe uma evidência nova (data posterior à recusa)",
      );
    }

    const eventStatus = parsed.data.status;
    const purpose: WhatsAppConsentPurpose | null =
      parsed.data.status === "OPTED_IN"
        ? (parsed.data.purpose ?? null)
        : null;
    const purposeNote =
      parsed.data.status === "OPTED_IN" && parsed.data.purpose === "OTHER"
        ? (parsed.data.purposeNote?.trim() ?? null)
        : null;
    const phoneE164 =
      parsed.data.status === "OPTED_IN"
        ? parsed.data.phoneE164?.trim() ?? null
        : lead.phoneE164;

    if (
      parsed.data.status === "OPTED_IN" &&
      (!phoneE164 || !isValidPhoneE164(phoneE164))
    ) {
      throw new WhatsAppConsentValidationError("Telefone E.164 inválido");
    }

    await createWhatsAppConsentEvent(
      {
        leadId: lead.id,
        status: eventStatus,
        source: parsed.data.source,
        purpose,
        purposeNote,
        evidenceAt,
        actorId: actor.id,
      },
      tx,
    );

    await applyWhatsAppConsentState(
      {
        leadId: lead.id,
        status: parsed.data.status,
        phoneE164,
      },
      tx,
    );

    return { leadId: lead.id, status: parsed.data.status };
  });
}
