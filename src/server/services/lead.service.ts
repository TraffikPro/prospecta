import { prisma } from "@/lib/prisma";
import {
  LeadDuplicateError,
  LeadValidationError,
} from "@/features/leads/lead.errors";
import { createLeadFormSchema } from "@/features/leads/lead.schema";
import {
  normalizeCompanyName,
  normalizeEmail,
  normalizePhone,
} from "@/features/leads/lead.normalize";
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
