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

export const leadSourceSchema = z.enum([
  "MANUAL",
  "GOOGLE_PLACES",
  "REFERRAL",
  "IMPORT",
]);

export const leadIntelligenceSchema = z
  .object({
    score: z.number().min(0).max(100).optional(),
    qualification: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
    signals: z.array(z.string().trim().min(1)).max(20).optional(),
    pitch: z.string().trim().max(2000).optional(),
    /** Preferred commercial diagnosis field for UI. */
    diagnostic: z.string().trim().max(2000).optional(),
    /** Legacy alias; UI adapter maps to diagnostic. */
    summary: z.string().trim().max(2000).optional(),
    rating: z.number().min(0).max(5).optional(),
    reviews: z.number().int().min(0).optional(),
    googleMapsUrl: z.string().url().optional(),
  })
  .passthrough();

export const ingestExternalLeadSchema = z
  .object({
    companyName: z.string().trim().min(1, "Empresa é obrigatória"),
    contactName: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    website: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (value) =>
          value === null ||
          value === undefined ||
          value === "" ||
          z.string().url().safeParse(value).success,
        "Website inválido",
      ),
    notes: z.string().trim().max(5000).optional(),
    source: leadSourceSchema,
    externalId: z.string().trim().min(1).optional(),
    ownerEmail: z.string().trim().email().optional(),
    intelligence: leadIntelligenceSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.source === "GOOGLE_PLACES" && !data.externalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "externalId é obrigatório para GOOGLE_PLACES",
        path: ["externalId"],
      });
    }

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

export type CreateLeadFormInput = z.infer<typeof createLeadFormSchema>;
export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
export type MoveLeadStageFormInput = z.infer<typeof moveLeadStageFormSchema>;
export type IngestExternalLeadInput = z.infer<typeof ingestExternalLeadSchema>;
