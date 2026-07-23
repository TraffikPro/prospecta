import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { LeadDuplicateError } from "@/features/leads/lead.errors";
import { hashPassword } from "@/server/auth/password";
import { createLeadForOwner } from "./lead.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe("createLeadForOwner", { skip: !hasDatabase }, () => {
  let ownerId = "";
  const suffix = Date.now().toString(36);

  before(async () => {
    const user = await prisma.user.upsert({
      where: { email: `lead-test-${suffix}@prospecta.test` },
      update: { isActive: true },
      create: {
        email: `lead-test-${suffix}@prospecta.test`,
        name: "Lead Test Owner",
        role: "MEMBER",
        passwordHash: await hashPassword("LeadTest123!"),
        isActive: true,
      },
    });
    ownerId = user.id;
  });

  after(async () => {
    await prisma.lead.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({
      where: { email: `lead-test-${suffix}@prospecta.test` },
    });
    await prisma.$disconnect();
  });

  it("creates a valid lead", async () => {
    const created = await createLeadForOwner({
      companyName: `Empresa Valida ${suffix}`,
      email: `valida-${suffix}@acme.example`,
      ownerId,
    });
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: created.id },
    });
    assert.equal(lead.stage, "NEW");
    assert.equal(lead.ownerId, ownerId);
    assert.equal(lead.email, `valida-${suffix}@acme.example`);
  });

  it("blocks duplicate email", async () => {
    const email = `dup-email-${suffix}@acme.example`;
    await createLeadForOwner({
      companyName: `Empresa Dup Email ${suffix}`,
      email,
      ownerId,
    });

    await assert.rejects(
      () =>
        createLeadForOwner({
          companyName: `Outra Empresa ${suffix}`,
          email: email.toUpperCase(),
          ownerId,
        }),
      LeadDuplicateError,
    );
  });

  it("blocks duplicate phone", async () => {
    const phone = "13988887777";
    await createLeadForOwner({
      companyName: `Empresa Dup Phone ${suffix}`,
      phone,
      ownerId,
    });

    await assert.rejects(
      () =>
        createLeadForOwner({
          companyName: `Outra Phone ${suffix}`,
          phone: "(13) 98888-7777",
          ownerId,
        }),
      LeadDuplicateError,
    );
  });
});
