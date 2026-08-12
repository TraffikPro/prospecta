import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/server/auth/password";
import { createAcquisitionJobAtomic } from "@/server/repositories/acquisition-job.repository";

const prisma = new PrismaClient();

describe("createAcquisitionJobAtomic", () => {
  const adminEmail = `acq-atomic-${Date.now()}@prospecta.test`;
  const fingerprint = `atomic-fp-${Date.now()}`;
  let adminId = "";

  before(async () => {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { isActive: true, role: "ADMIN" },
      create: {
        email: adminEmail,
        name: "Acq Atomic",
        role: "ADMIN",
        passwordHash: await hashPassword("AcqAtomic123!"),
        isActive: true,
      },
    });
    adminId = user.id;
  });

  after(async () => {
    await prisma.acquisitionJob.deleteMany({ where: { requestedById: adminId } });
    await prisma.user.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  it("allows only one active job per fingerprint under concurrency", async () => {
    const timeoutAt = new Date(Date.now() + 15 * 60 * 1000);
    const payload = {
      city: "Santos SP",
      query: "clínica odontológica",
      limit: 3,
      campaign: "atomic-campaign-test",
      fingerprint,
      requestedById: adminId,
      timeoutAt,
    };

    const results = await Promise.all([
      createAcquisitionJobAtomic(payload),
      createAcquisitionJobAtomic(payload),
      createAcquisitionJobAtomic(payload),
    ]);

    const created = results.filter((r) => r.kind === "created");
    const conflicts = results.filter((r) => r.kind === "conflict");
    assert.equal(created.length, 1);
    assert.equal(conflicts.length, 2);

    const active = await prisma.acquisitionJob.count({
      where: { fingerprint, status: { in: ["QUEUED", "RUNNING"] } },
    });
    assert.equal(active, 1);
  });
});
