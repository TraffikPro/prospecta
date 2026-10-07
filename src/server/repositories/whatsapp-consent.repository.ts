import type {
  Prisma,
  WhatsAppConsentEvent,
  WhatsAppConsentEventStatus,
  WhatsAppConsentPurpose,
  WhatsAppConsentSource,
  WhatsAppConsentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type WhatsAppConsentEventWithActor = WhatsAppConsentEvent & {
  actor: {
    id: string;
    name: string;
    email: string;
  };
};

export type CreateWhatsAppConsentEventData = {
  leadId: string;
  status: WhatsAppConsentEventStatus;
  source: WhatsAppConsentSource;
  purpose: WhatsAppConsentPurpose | null;
  purposeNote: string | null;
  evidenceAt: Date;
  actorId: string;
};

export type ApplyWhatsAppConsentStateData = {
  leadId: string;
  status: WhatsAppConsentStatus;
  phoneE164: string | null;
};

/**
 * Append-only. This module must not update or delete consent events.
 */
export async function createWhatsAppConsentEvent(
  data: CreateWhatsAppConsentEventData,
  db: DbClient = prisma,
): Promise<WhatsAppConsentEvent> {
  return db.whatsAppConsentEvent.create({
    data: {
      leadId: data.leadId,
      status: data.status,
      source: data.source,
      purpose: data.purpose,
      purposeNote: data.purposeNote,
      evidenceAt: data.evidenceAt,
      actorId: data.actorId,
    },
  });
}

export async function applyWhatsAppConsentState(
  data: ApplyWhatsAppConsentStateData,
  db: DbClient = prisma,
): Promise<void> {
  await db.lead.update({
    where: { id: data.leadId },
    data: {
      whatsappConsentStatus: data.status,
      ...(data.status === "OPTED_IN" ? { phoneE164: data.phoneE164 } : {}),
    },
  });
}

export async function listWhatsAppConsentEventsByLeadId(
  leadId: string,
): Promise<WhatsAppConsentEventWithActor[]> {
  return prisma.whatsAppConsentEvent.findMany({
    where: { leadId },
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findLatestWhatsAppConsentEvent(
  leadId: string,
  db: DbClient = prisma,
): Promise<WhatsAppConsentEvent | null> {
  return db.whatsAppConsentEvent.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}
