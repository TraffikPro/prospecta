import type { ActivityOutcome, ActivityType } from "@prisma/client";

export const activityTypeLabels: Record<
  Exclude<ActivityType, "STAGE_CHANGE">,
  string
> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  NOTE: "Nota",
};

export const activityOutcomeLabels: Record<ActivityOutcome, string> = {
  SENT_NO_REPLY: "Enviado sem resposta",
  REPLIED: "Respondeu",
  NOT_INTERESTED: "Sem interesse",
  INTERESTED: "Interessado",
  MEETING_SCHEDULED: "Reunião agendada",
  WRONG_CONTACT: "Contato errado",
  OTHER: "Outro",
};
