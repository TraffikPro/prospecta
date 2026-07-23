import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/server/auth/password";
import { LeadDuplicateError } from "@/features/leads/lead.errors";
import { ingestExternalLead } from "./lead.service";

const prisma = new PrismaClient();

describe("ingestExternalLead", () => {
  const ownerEmail = `ingest-owner-${Date.now()}@prospecta.test`;
  let ownerId = "";

  before(async () => {
    const user = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: { isActive: true },
      create: {
        email: ownerEmail,
        name: "Ingest Owner",
        role: "MEMBER",
        passwordHash: await hashPassword("IngestOwner123!"),
        isActive: true,
      },
    });
    ownerId = user.id;
  });

  after(async () => {
    await prisma.lead.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({ where: { id: ownerId } });
    await prisma.$disconnect();
  });

  it("creates GOOGLE_PLACES lead with intelligence and is idempotent by externalId", async () => {
    const externalId = `place_${Date.now()}`;
    const payload = {
      companyName: "Clínica Ingest Test",
      phone: "13987654321",
      website: null,
      source: "GOOGLE_PLACES" as const,
      externalId,
      ownerEmail,
      intelligence: {
        score: 90,
        qualification: "HIGH" as const,
        signals: ["NO_WEBSITE", "HIGH_RATING"],
        pitch: "Boa reputação sem site próprio.",
        summary: "Oportunidade alta",
      },
    };

    const first = await ingestExternalLead(payload);
    assert.equal(first.created, true);
    assert.equal(first.stage, "NEW");

    const stored = await prisma.lead.findUniqueOrThrow({
      where: { id: first.id },
    });
    assert.equal(stored.source, "GOOGLE_PLACES");
    assert.equal(stored.externalId, externalId);
    assert.equal(stored.ownerId, ownerId);
    assert.ok(stored.notes?.includes("Score: 90/100"));
    assert.deepEqual(stored.intelligence, payload.intelligence);

    const second = await ingestExternalLead(payload);
    assert.equal(second.created, false);
    assert.equal(second.id, first.id);

    const count = await prisma.lead.count({
      where: { source: "GOOGLE_PLACES", externalId },
    });
    assert.equal(count, 1);
  });

  it("rejects GOOGLE_PLACES without externalId", async () => {
    await assert.rejects(
      () =>
        ingestExternalLead({
          companyName: "Sem External",
          phone: "11999998888",
          source: "GOOGLE_PLACES",
          ownerEmail,
        }),
      /externalId/,
    );
  });

  it("rejects duplicate phone with different externalId", async () => {
    const phone = "11988887777";
    await ingestExternalLead({
      companyName: "Empresa A",
      phone,
      source: "GOOGLE_PLACES",
      externalId: `place_a_${Date.now()}`,
      ownerEmail,
    });

    await assert.rejects(
      () =>
        ingestExternalLead({
          companyName: "Empresa B",
          phone,
          source: "GOOGLE_PLACES",
          externalId: `place_b_${Date.now()}`,
          ownerEmail,
        }),
      (error: unknown) => error instanceof LeadDuplicateError,
    );
  });
});
