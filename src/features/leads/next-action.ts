import type { ActivityOutcome, LeadStage } from "@prisma/client";

import { activityOutcomeLabels } from "@/features/activities/activity.labels";

export type NextActionInput = {
  stage: LeadStage;
  nextFollowUpAt: Date | null;
  /** Latest commercial outcome (ignore STAGE_CHANGE / null). */
  latestOutcome: ActivityOutcome | null;
  now?: Date;
};

export type FollowUpState = "none" | "scheduled" | "due_today" | "overdue";

export type NextActionView = {
  statusLabel: string;
  actionLabel: string;
  followUpAt: Date | null;
  followUpState: FollowUpState;
};

/** UTC calendar day — deterministic on Vercel (UTC) and in unit tests. */
function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function classifyFollowUp(
  followUpAt: Date | null,
  now: Date,
): FollowUpState {
  if (!followUpAt) {
    return "none";
  }
  if (sameCalendarDay(followUpAt, now)) {
    return "due_today";
  }
  if (followUpAt.getTime() < now.getTime()) {
    return "overdue";
  }
  return "scheduled";
}

export function getNextAction(input: NextActionInput): NextActionView {
  const now = input.now ?? new Date();
  const followUpState = classifyFollowUp(input.nextFollowUpAt, now);
  const followUpAt = input.nextFollowUpAt;

  if (input.stage === "WON") {
    return {
      statusLabel: "Cliente ganho",
      actionLabel: "Nenhuma ação comercial pendente",
      followUpAt,
      followUpState,
    };
  }

  if (input.stage === "LOST") {
    return {
      statusLabel: "Encerrado",
      actionLabel: "Lead perdido — sem próxima ação",
      followUpAt,
      followUpState,
    };
  }

  const outcome = input.latestOutcome;

  if (!outcome) {
    return {
      statusLabel: "Sem contato realizado",
      actionLabel: "Fazer primeiro contato",
      followUpAt,
      followUpState,
    };
  }

  const statusLabel = activityOutcomeLabels[outcome];

  switch (outcome) {
    case "SENT_NO_REPLY": {
      if (followUpState === "scheduled") {
        return {
          statusLabel,
          actionLabel: "Aguardar follow-up",
          followUpAt,
          followUpState,
        };
      }
      return {
        statusLabel,
        actionLabel: "Enviar follow-up",
        followUpAt,
        followUpState,
      };
    }
    case "REPLIED":
    case "INTERESTED":
      return {
        statusLabel,
        actionLabel: "Continuar conversa",
        followUpAt,
        followUpState,
      };
    case "MEETING_SCHEDULED":
      return {
        statusLabel,
        actionLabel: "Preparar reunião",
        followUpAt,
        followUpState,
      };
    case "NOT_INTERESTED":
    case "WRONG_CONTACT":
      return {
        statusLabel,
        actionLabel: "Encerrado — sem próxima ação",
        followUpAt,
        followUpState,
      };
    case "OTHER":
    default:
      return {
        statusLabel,
        actionLabel:
          followUpState === "none" || followUpState === "overdue"
            ? "Definir próximo passo"
            : "Seguir próximo passo agendado",
        followUpAt,
        followUpState,
      };
  }
}

export function pickLatestOutcome(
  activities: Array<{ outcome: ActivityOutcome | null; type: string }>,
): ActivityOutcome | null {
  for (const activity of activities) {
    if (activity.type === "STAGE_CHANGE") {
      continue;
    }
    if (activity.outcome) {
      return activity.outcome;
    }
  }
  return null;
}
