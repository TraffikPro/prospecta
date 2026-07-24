import type { LeadStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  LeadDuplicateError,
  LeadValidationError,
} from "@/features/leads/lead.errors";
import { LEAD_STAGE_ORDER } from "@/features/leads/lead.labels";
import {
  createLeadFormSchema,
  ingestExternalLeadSchema,
  moveLeadStageFormSchema,
} from "@/features/leads/lead.schema";
import {
  normalizeCompanyName,
  normalizeEmail,
  normalizePhone,
} from "@/features/leads/lead.normalize";
import { buildStageChangeBody } from "@/features/leads/stage-change";
import { createActivity } from "@/server/repositories/activity.repository";
import {
  buildIntelligenceInbox,
  countByQualification,
  type IntelligenceInboxFilters,
  type IntelligenceInboxLead,
} from "@/features/leads/intelligence/inbox";
import { buildMyQueue, type MyQueueView } from "@/features/leads/my-queue";
import {
  createLead as createLeadRecord,
  findDuplicate,
  findLeadById,
  findLeadBySourceExternalId,
  listLeads,
  listLeadsForOwnerQueue,
  listLeadsWithIntelligence,
  type LeadWithOwner,
} from "@/server/repositories/lead.repository";

export type CreateLeadCommand = {
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  ownerId: string;
};

export async function createLeadForOwner(
  input: CreateLeadCommand,
): Promise<{ id: string }> {
  const parsed = createLeadFormSchema.safeParse({
    companyName: input.companyName,
    contactName: input.contactName,
    email: input.email,
    phone: input.phone,
    website: input.website,
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Dados do lead inválidos";
    throw new LeadValidationError(message);
  }

  const companyName = normalizeCompanyName(parsed.data.companyName);
  const email = normalizeEmail(parsed.data.email);
  const phone = normalizePhone(parsed.data.phone);
  const contactName = parsed.data.contactName?.trim() || null;
  const website =
    parsed.data.website && parsed.data.website.trim() !== ""
      ? parsed.data.website.trim()
      : null;

  const owner = await prisma.user.findFirst({
    where: { id: input.ownerId, isActive: true },
    select: { id: true },
  });
  if (!owner) {
    throw new LeadValidationError("Responsável inválido ou inativo");
  }

  const duplicate = await findDuplicate({
    emailNormalized: email,
    phoneNormalized: phone,
  });
  if (duplicate) {
    throw new LeadDuplicateError(duplicate.id);
  }

  const lead = await createLeadRecord({
    companyName,
    contactName,
    email,
    phone,
    website,
    stage: "NEW",
    ownerId: owner.id,
  });

  return { id: lead.id };
}

export async function getLeadById(id: string): Promise<LeadWithOwner | null> {
  return findLeadById(id);
}

export async function getLeads(): Promise<LeadWithOwner[]> {
  return listLeads();
}

export async function getMyQueueForOwner(
  ownerId: string,
): Promise<MyQueueView> {
  const leads = await listLeadsForOwnerQueue(ownerId);
  return buildMyQueue(leads);
}

export type IntelligenceInboxResult = {
  items: IntelligenceInboxLead[];
  counts: ReturnType<typeof countByQualification>;
};

export async function getIntelligenceInbox(
  filters: IntelligenceInboxFilters,
): Promise<IntelligenceInboxResult> {
  const leads = await listLeadsWithIntelligence();
  const allItems = buildIntelligenceInbox(leads, {
    qualification: "ALL",
    source: "ALL",
  });
  const items = buildIntelligenceInbox(leads, filters);
  return {
    items,
    counts: countByQualification(allItems),
  };
}

export type LeadsByStage = Record<LeadStage, LeadWithOwner[]>;

export async function getLeadsGroupedByStage(): Promise<LeadsByStage> {
  const leads = await listLeads();
  const grouped = Object.fromEntries(
    LEAD_STAGE_ORDER.map((stage) => [stage, [] as LeadWithOwner[]]),
  ) as LeadsByStage;

  for (const lead of leads) {
    grouped[lead.stage].push(lead);
  }
  return grouped;
}

export type MoveLeadStageCommand = {
  leadId: string;
  actorId: string;
  stage: string;
  lostReason?: string;
};

export type MoveLeadStageResult = {
  leadId: string;
  from: LeadStage;
  to: LeadStage;
  activityId: string;
};

export async function moveLeadStage(
  input: MoveLeadStageCommand,
): Promise<MoveLeadStageResult> {
  const parsed = moveLeadStageFormSchema.safeParse({
    leadId: input.leadId,
    stage: input.stage,
    lostReason: input.lostReason,
  });

  if (!parsed.success) {
    throw new LeadValidationError(
      parsed.error.issues[0]?.message ?? "Mudança de stage inválida",
    );
  }

  const actor = await prisma.user.findFirst({
    where: { id: input.actorId, isActive: true },
    select: { id: true },
  });
  if (!actor) {
    throw new LeadValidationError("Usuário inválido ou inativo");
  }

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: { id: parsed.data.leadId },
      select: { id: true, stage: true },
    });
    if (!lead) {
      throw new LeadValidationError("Lead não encontrado");
    }

    if (lead.stage === parsed.data.stage) {
      throw new LeadValidationError("O lead já está neste stage");
    }

    const lostReason =
      parsed.data.stage === "LOST"
        ? parsed.data.lostReason?.trim() || null
        : null;

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        stage: parsed.data.stage,
        lostReason,
      },
    });

    const activity = await createActivity(
      {
        leadId: lead.id,
        authorId: actor.id,
        type: "STAGE_CHANGE",
        outcome: null,
        body: buildStageChangeBody(lead.stage, parsed.data.stage),
      },
      tx,
    );

    return {
      leadId: lead.id,
      from: lead.stage,
      to: parsed.data.stage,
      activityId: activity.id,
    };
  });
}

export type IngestExternalLeadResult = {
  id: string;
  created: boolean;
  stage: LeadStage;
};

function buildNotesFromIntelligence(
  notes: string | undefined,
  intelligence:
    | {
        diagnostic?: string;
        summary?: string;
        pitch?: string;
        score?: number;
      }
    | undefined,
): string | null {
  if (notes?.trim()) {
    return notes.trim();
  }
  if (!intelligence) {
    return null;
  }
  const parts: string[] = [];
  if (typeof intelligence.score === "number") {
    parts.push(`Score: ${intelligence.score}/100`);
  }
  const diagnosis = intelligence.diagnostic ?? intelligence.summary;
  if (diagnosis) {
    parts.push(diagnosis);
  }
  if (intelligence.pitch) {
    parts.push(`Pitch: ${intelligence.pitch}`);
  }
  return parts.length > 0 ? parts.join("\n") : null;
}

async function resolveIngestOwnerId(ownerEmail?: string): Promise<string> {
  const email =
    ownerEmail?.trim().toLowerCase() ||
    process.env.LEAD_INGEST_DEFAULT_OWNER_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new LeadValidationError(
      "ownerEmail ou LEAD_INGEST_DEFAULT_OWNER_EMAIL é obrigatório",
    );
  }

  const owner = await prisma.user.findFirst({
    where: { email, isActive: true },
    select: { id: true },
  });
  if (!owner) {
    throw new LeadValidationError("Owner inválido ou inativo");
  }
  return owner.id;
}

export async function ingestExternalLead(
  input: unknown,
): Promise<IngestExternalLeadResult> {
  const parsed = ingestExternalLeadSchema.safeParse(input);
  if (!parsed.success) {
    throw new LeadValidationError(
      parsed.error.issues[0]?.message ?? "Payload de ingestão inválido",
    );
  }

  const data = parsed.data;
  const companyName = normalizeCompanyName(data.companyName);
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const contactName = data.contactName?.trim() || null;
  const website =
    data.website && data.website.trim() !== "" ? data.website.trim() : null;
  const externalId = data.externalId?.trim() || null;
  const notes = buildNotesFromIntelligence(data.notes, data.intelligence);
  const intelligence = (data.intelligence ?? null) as Prisma.InputJsonValue | null;

  if (externalId) {
    const existingByExternal = await findLeadBySourceExternalId(
      data.source,
      externalId,
    );
    if (existingByExternal) {
      return {
        id: existingByExternal.id,
        created: false,
        stage: existingByExternal.stage,
      };
    }
  }

  const duplicate = await findDuplicate({
    emailNormalized: email,
    phoneNormalized: phone,
  });
  if (duplicate) {
    throw new LeadDuplicateError(duplicate.id);
  }

  const ownerId = await resolveIngestOwnerId(data.ownerEmail);

  const lead = await createLeadRecord({
    companyName,
    contactName,
    email,
    phone,
    website,
    notes,
    source: data.source,
    externalId,
    intelligence,
    stage: "NEW",
    ownerId,
  });

  return {
    id: lead.id,
    created: true,
    stage: lead.stage,
  };
}
