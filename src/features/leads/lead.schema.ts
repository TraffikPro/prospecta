import { z } from "zod";

export const leadStageSchema = z.enum([
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "MEETING",
  "WON",
  "LOST",
]);

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

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
