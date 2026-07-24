import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

import { assertSafeForMutableTestsOrThrow } from "../../src/lib/safety/production-mutation-guard";

loadEnvConfig(process.cwd());

type CreateIntelligenceLeadInput = {
  companyName: string;
  phone: string;
  ownerEmail: string;
  externalId: string;
  intelligence: {
    score: number;
    qualification: "HIGH" | "MEDIUM" | "LOW";
    signals: string[];
    diagnostic: string;
    pitch: string;
  };
};

export async function createIntelligenceLead(
  input: CreateIntelligenceLeadInput,
): Promise<{ id: string }> {
  assertSafeForMutableTestsOrThrow({
    databaseUrl: process.env.DATABASE_URL,
    appUrl:
      process.env.PLAYWRIGHT_BASE_URL || process.env.NEXT_PUBLIC_APP_URL,
    breakGlass: process.env.PROSPECTA_ALLOW_PROD_DB_MUTATION,
  });

  const prisma = new PrismaClient();
  try {
    const email = input.ownerEmail.trim().toLowerCase();
    const owner = await prisma.user.update({
      where: { email },
      data: { isActive: true },
      select: { id: true },
    });

    const lead = await prisma.lead.create({
      data: {
        companyName: input.companyName,
        phone: input.phone,
        source: "GOOGLE_PLACES",
        externalId: input.externalId,
        stage: "NEW",
        ownerId: owner.id,
        intelligence: input.intelligence,
        notes: input.intelligence.diagnostic,
      },
      select: { id: true },
    });

    return lead;
  } finally {
    await prisma.$disconnect();
  }
}
