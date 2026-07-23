import type { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  LeadDuplicateError,
  LeadValidationError,
} from "@/features/leads/lead.errors";
import { LEAD_STAGE_ORDER } from "@/features/leads/lead.labels";
import {
  createLeadFormSchema,
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
  createLead as createLeadRecord,
  findDuplicate,
  findLeadById,
  listLeads,
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
