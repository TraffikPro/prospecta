import {
  Prisma,
  type ActivityOutcome,
  type ActivityType,
  type Lead,
  type LeadSource,
  type LeadStage,
} from "@prisma/client";
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
  notes?: string | null;
  source?: LeadSource;
  externalId?: string | null;
  intelligence?: Prisma.InputJsonValue | null;
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

export async function findLeadBySourceExternalId(
  source: LeadSource,
  externalId: string,
): Promise<Lead | null> {
  return prisma.lead.findUnique({
    where: {
      source_externalId: {
        source,
        externalId,
      },
    },
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
      notes: data.notes || null,
      source: data.source ?? "MANUAL",
      externalId: data.externalId || null,
      intelligence: data.intelligence ?? undefined,
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

export type LeadForOwnerQueue = LeadWithOwner & {
  activities: Array<{
    outcome: ActivityOutcome | null;
    type: ActivityType;
    createdAt: Date;
  }>;
};

/** Active leads owned by user, with latest non–stage-change activity for queue UI. */
export async function listLeadsForOwnerQueue(
  ownerId: string,
): Promise<LeadForOwnerQueue[]> {
  return prisma.lead.findMany({
    where: {
      ownerId,
      stage: { notIn: ["WON", "LOST"] },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      activities: {
        where: { type: { not: "STAGE_CHANGE" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { outcome: true, type: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Leads that may carry Lead Intelligence JSON (inbox candidates). */
export async function listLeadsWithIntelligence(): Promise<LeadWithOwner[]> {
  return prisma.lead.findMany({
    where: {
      intelligence: { not: Prisma.DbNull },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
