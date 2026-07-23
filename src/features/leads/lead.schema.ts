import { z } from "zod";
import {
  isPhoneDigitCountValid,
  normalizeEmail,
  normalizePhone,
} from "./lead.normalize";

export const leadStageSchema = z.enum([
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "MEETING",
  "WON",
  "LOST",
]);

export const createLeadFormSchema = z
  .object({
    companyName: z.string().trim().min(1, "Empresa é obrigatória"),
    contactName: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    website: z
      .string()
      .trim()
      .optional()
      .refine(
        (value) => !value || value === "" || z.string().url().safeParse(value).success,
        "Website inválido",
      ),
  })
  .superRefine((data, ctx) => {
    const email = normalizeEmail(data.email);
    const phone = normalizePhone(data.phone);

    if (!email && !phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe e-mail ou telefone",
        path: ["email"],
      });
      return;
    }

    if (email && !z.string().email().safeParse(email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "E-mail inválido",
        path: ["email"],
      });
    }

    if (phone && !isPhoneDigitCountValid(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Telefone deve ter ao menos 10 dígitos",
        path: ["phone"],
      });
    }
  });

/** @deprecated Prefer createLeadFormSchema; kept for existing tests during transition */
export const createLeadInputSchema = z
  .object({
    companyName: z.string().trim().min(1),
    contactName: z.string().trim().optional(),
    title: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    website: z.string().trim().url().optional().or(z.literal("")),
    notes: z.string().trim().optional(),
    ownerId: z.string().min(1),
    stage: leadStageSchema.default("NEW"),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "At least one of email or phone is required",
    path: ["email"],
  });

export const moveLeadStageFormSchema = z
  .object({
    leadId: z.string().min(1),
    stage: leadStageSchema,
    lostReason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.stage === "LOST") {
      if (!data.lostReason || data.lostReason.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Motivo é obrigatório ao marcar como perdido",
          path: ["lostReason"],
        });
      }
    }
  });

export type CreateLeadFormInput = z.infer<typeof createLeadFormSchema>;
export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
export type MoveLeadStageFormInput = z.infer<typeof moveLeadStageFormSchema>;
