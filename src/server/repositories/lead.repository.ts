import type { Lead, LeadStage, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LeadWithOwner = Lead & {
  owner: {
    id: string;
    name: string;
    email: string;
  };
};

export type CreateLeadData = {
  companyName: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  stage: LeadStage;
  ownerId: string;
};

export type DuplicateLookup = {
  emailNormalized: string | null;
  phoneNormalized: string | null;
};

export async function findDuplicate(
  lookup: DuplicateLookup,
): Promise<Lead | null> {
  const or: Prisma.LeadWhereInput[] = [];

  if (lookup.emailNormalized) {
    or.push({ email: lookup.emailNormalized });
  }
  if (lookup.phoneNormalized) {
    or.push({ phone: lookup.phoneNormalized });
  }
  if (or.length === 0) {
    return null;
  }

  return prisma.lead.findFirst({
    where: { OR: or },
    orderBy: { createdAt: "asc" },
  });
}

export async function createLead(data: CreateLeadData): Promise<Lead> {
  return prisma.lead.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      stage: data.stage,
      ownerId: data.ownerId,
    },
  });
}

export async function findLeadById(
  id: string,
): Promise<LeadWithOwner | null> {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function listLeads(): Promise<LeadWithOwner[]> {
  return prisma.lead.findMany({
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
