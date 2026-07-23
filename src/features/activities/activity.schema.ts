import { z } from "zod";
import {
  isOutreachType,
  shouldRequireNextFollowUp,
  USER_ACTIVITY_TYPES,
} from "./activity.rules";

export const activityTypeFormSchema = z.enum(USER_ACTIVITY_TYPES);

export const activityOutcomeSchema = z.enum([
  "SENT_NO_REPLY",
  "REPLIED",
  "NOT_INTERESTED",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "WRONG_CONTACT",
  "OTHER",
]);

export const createActivityFormSchema = z
  .object({
    leadId: z.string().min(1),
    type: activityTypeFormSchema,
    outcome: activityOutcomeSchema.optional(),
    body: z.string().trim().min(1, "Descrição é obrigatória"),
    nextFollowUpAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (isOutreachType(data.type) && !data.outcome) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Resultado é obrigatório para WhatsApp e e-mail",
        path: ["outcome"],
      });
    }

    const requiresFollowUp = shouldRequireNextFollowUp({
      type: data.type,
      outcome: data.outcome,
    });

    if (requiresFollowUp) {
      if (!data.nextFollowUpAt || data.nextFollowUpAt.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Próximo passo (data) é obrigatório para este resultado",
          path: ["nextFollowUpAt"],
        });
        return;
      }
      const parsedDate = new Date(data.nextFollowUpAt);
      if (Number.isNaN(parsedDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data do próximo passo inválida",
          path: ["nextFollowUpAt"],
        });
      }
    }
  });

export type CreateActivityFormInput = z.infer<typeof createActivityFormSchema>;
