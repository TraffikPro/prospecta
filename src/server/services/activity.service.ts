import type { ActivityOutcome, LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ActivityValidationError,
  LeadNotFoundError,
} from "@/features/activities/activity.errors";
import {
  isOutreachType,
  shouldAutoMoveToContacted,
  shouldRequireNextFollowUp,
} from "@/features/activities/activity.rules";
import { createActivityFormSchema } from "@/features/activities/activity.schema";
import {
  countOutreachByLeadId,
  createActivity,
  listActivitiesByLeadId,
  type ActivityWithAuthor,
} from "@/server/repositories/activity.repository";

export type CreateActivityCommand = {
  leadId: string;
  authorId: string;
  type: string;
  outcome?: string;
  body: string;
  nextFollowUpAt?: string;
};

export type CreateActivityResult = {
  activityId: string;
  leadId: string;
  stage: LeadStage;
  nextFollowUpAt: Date | null;
};

function parseOptionalDate(value: string | undefined): Date | null {
  if (!value || value.trim() === "") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ActivityValidationError("Data do próximo passo inválida");
  }
  return date;
}

export async function createActivityForLead(
  input: CreateActivityCommand,
): Promise<CreateActivityResult> {
  const parsed = createActivityFormSchema.safeParse({
    leadId: input.leadId,
    type: input.type,
    outcome: input.outcome || undefined,
    body: input.body,
    nextFollowUpAt: input.nextFollowUpAt,
  });

  if (!parsed.success) {
    throw new ActivityValidationError(
      parsed.error.issues[0]?.message ?? "Dados da atividade inválidos",
    );
  }

  const requiresFollowUp = shouldRequireNextFollowUp({
    type: parsed.data.type,
    outcome: parsed.data.outcome,
  });
  const nextFollowUpAt = parseOptionalDate(parsed.data.nextFollowUpAt);

  if (requiresFollowUp && !nextFollowUpAt) {
    throw new ActivityValidationError(
      "Próximo passo (data) é obrigatório para este resultado",
    );
  }

  const author = await prisma.user.findFirst({
    where: { id: input.authorId, isActive: true },
    select: { id: true },
  });
  if (!author) {
    throw new ActivityValidationError("Autor inválido ou inativo");
  }

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({
      where: { id: parsed.data.leadId },
      select: { id: true, stage: true },
    });
    if (!lead) {
      throw new LeadNotFoundError(parsed.data.leadId);
    }

    const activity = await createActivity(
      {
        leadId: lead.id,
        authorId: author.id,
        type: parsed.data.type,
        outcome: (parsed.data.outcome as ActivityOutcome | undefined) ?? null,
        body: parsed.data.body.trim(),
      },
      tx,
    );

    let nextStage: LeadStage = lead.stage;
    if (isOutreachType(parsed.data.type) && shouldAutoMoveToContacted(lead.stage)) {
      const priorOutreach = await countOutreachByLeadId(lead.id, tx);
      // count includes the activity just created
      if (priorOutreach === 1) {
        nextStage = "CONTACTED";
      }
    }

    const leadUpdate: {
      stage?: LeadStage;
      nextFollowUpAt?: Date | null;
    } = {};

    if (nextStage !== lead.stage) {
      leadUpdate.stage = nextStage;
    }

    if (requiresFollowUp) {
      leadUpdate.nextFollowUpAt = nextFollowUpAt;
    } else if (nextFollowUpAt) {
      leadUpdate.nextFollowUpAt = nextFollowUpAt;
    }

    if (Object.keys(leadUpdate).length > 0) {
      await tx.lead.update({
        where: { id: lead.id },
        data: leadUpdate,
      });
    }

    const updated = await tx.lead.findUniqueOrThrow({
      where: { id: lead.id },
      select: { stage: true, nextFollowUpAt: true },
    });

    return {
      activityId: activity.id,
      leadId: lead.id,
      stage: updated.stage,
      nextFollowUpAt: updated.nextFollowUpAt,
    };
  });
}

export async function getActivitiesForLead(
  leadId: string,
): Promise<ActivityWithAuthor[]> {
  return listActivitiesByLeadId(leadId);
}
