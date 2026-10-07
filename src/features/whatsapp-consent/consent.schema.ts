import { z } from "zod";
import { isValidPhoneE164 } from "./phone-e164";

export const WHATSAPP_CONSENT_SOURCES = [
  "PHONE_CALL",
  "EMAIL",
  "FORM",
  "INBOUND_WHATSAPP",
  "OTHER",
] as const;

export const WHATSAPP_CONSENT_PURPOSES = [
  "PRESENTATION",
  "DEMO",
  "MEETING",
  "FOLLOW_UP",
  "OTHER",
] as const;

/** Clock skew allowance — reject evidence far in the future. */
export const EVIDENCE_AT_MAX_FUTURE_MS = 24 * 60 * 60 * 1000;

export const PURPOSE_NOTE_MAX_LENGTH = 200;

export const whatsappConsentSourceSchema = z.enum(WHATSAPP_CONSENT_SOURCES);
export const whatsappConsentPurposeSchema = z.enum(WHATSAPP_CONSENT_PURPOSES);

export const recordWhatsAppConsentSchema = z
  .object({
    leadId: z.string().min(1),
    status: z.enum(["OPTED_IN", "OPTED_OUT"]),
    source: whatsappConsentSourceSchema,
    purpose: whatsappConsentPurposeSchema.optional(),
    purposeNote: z.string().optional(),
    evidenceAt: z.string().min(1, "Data da evidência é obrigatória"),
    phoneE164: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const parsedDate = new Date(data.evidenceAt);
    if (Number.isNaN(parsedDate.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data da evidência inválida",
        path: ["evidenceAt"],
      });
    } else if (parsedDate.getTime() - Date.now() > EVIDENCE_AT_MAX_FUTURE_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data da evidência não pode ser no futuro",
        path: ["evidenceAt"],
      });
    }

    if (data.status === "OPTED_IN") {
      if (!data.purpose) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Finalidade é obrigatória",
          path: ["purpose"],
        });
      }
      if (data.purpose === "OTHER") {
        const note = data.purposeNote?.trim() ?? "";
        if (note.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Descreva a finalidade quando for Outro",
            path: ["purposeNote"],
          });
        } else if (note.length > PURPOSE_NOTE_MAX_LENGTH) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Finalidade deve ter no máximo ${PURPOSE_NOTE_MAX_LENGTH} caracteres`,
            path: ["purposeNote"],
          });
        }
      }
      if (!data.phoneE164 || !isValidPhoneE164(data.phoneE164.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Telefone E.164 inválido",
          path: ["phoneE164"],
        });
      }
    }
  });

export type RecordWhatsAppConsentInput = z.infer<
  typeof recordWhatsAppConsentSchema
>;
