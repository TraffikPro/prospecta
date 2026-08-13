import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/server/auth/password";
import { createAcquisitionJobAtomic } from "@/server/repositories/acquisition-job.repository";

const prisma = new PrismaClient();

describe("acquisition requester attribution", () => {
  const stamp = Date.now();
  const memberEmail = `acq-member-${stamp}@prospecta.test`;
  let memberId = "";

  before(async () => {
    const member = await prisma.user.upsert({
      where: { email: memberEmail },
      update: {
        isActive: true,
        role: "MEMBER",
        canRunAcquisition: true,
      },
      create: {
        email: memberEmail,
        name: "Acq Member",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("AcqMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;
  });

  after(async () => {
    await prisma.acquisitionJob.deleteMany({ where: { requestedById: memberId } });
    await prisma.user.deleteMany({ where: { id: memberId } });
    await prisma.$disconnect();
  });

  it("stores requestedById for authorized MEMBER jobs", async () => {
    const created = await createAcquisitionJobAtomic({
      city: "Santos SP",
      query: "ortodontista",
      limit: 1,
      campaign: `member-attr-${stamp}`,
      fingerprint: `member-fp-${stamp}`,
      requestedById: memberId,
      timeoutAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    assert.equal(created.kind, "created");
    if (created.kind !== "created") return;

    const job = await prisma.acquisitionJob.findUniqueOrThrow({
      where: { id: created.job.id },
      include: { requestedBy: { select: { id: true, email: true } } },
    });
    assert.equal(job.requestedById, memberId);
    assert.equal(job.requestedBy.email, memberEmail);
  });
});
