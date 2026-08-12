import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/server/auth/password";
import {
  AcquisitionConflictError,
  applyAcquisitionJobCallback,
  isAcquisitionJobTimedOut,
} from "./acquisition-job.service";

const prisma = new PrismaClient();

describe("applyAcquisitionJobCallback", () => {
  const adminEmail = `acq-admin-${Date.now()}@prospecta.test`;
  let adminId = "";
  let jobId = "";

  before(async () => {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { isActive: true, role: "ADMIN" },
      create: {
        email: adminEmail,
        name: "Acq Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("AcqAdmin123!"),
        isActive: true,
      },
    });
    adminId = user.id;

    const job = await prisma.acquisitionJob.create({
      data: {
        city: "Santos SP",
        query: "clínica odontológica",
        limit: 5,
        campaign: "test-acquisition-campaign",
        fingerprint: `test-fp-${Date.now()}`,
        requestedById: adminId,
        timeoutAt: new Date(Date.now() + 15 * 60 * 1000),
        status: "QUEUED",
      },
    });
    jobId = job.id;
  });

  after(async () => {
    await prisma.acquisitionJob.deleteMany({ where: { requestedById: adminId } });
    await prisma.user.deleteMany({ where: { id: adminId } });
    await prisma.$disconnect();
  });

  it("transitions QUEUED → RUNNING → SUCCEEDED with counts", async () => {
    const running = await applyAcquisitionJobCallback(jobId, {
      status: "RUNNING",
    });
    assert.equal(running.status, "RUNNING");

    const done = await applyAcquisitionJobCallback(jobId, {
      status: "SUCCEEDED",
      foundCount: 40,
      qualifiedCount: 20,
      createdTotal: 8,
      createdHigh: 8,
      existingCount: 2,
      failedCount: 0,
    });
    assert.equal(done.status, "SUCCEEDED");

    const stored = await prisma.acquisitionJob.findUniqueOrThrow({
      where: { id: jobId },
    });
    assert.equal(stored.createdHigh, 8);
    assert.equal(stored.foundCount, 40);
    assert.ok(stored.finishedAt);
  });

  it("rejects transition out of SUCCEEDED", async () => {
    await assert.rejects(
      () =>
        applyAcquisitionJobCallback(jobId, {
          status: "RUNNING",
        }),
      AcquisitionConflictError,
    );
  });

  it("detects timeout for active jobs", () => {
    assert.equal(
      isAcquisitionJobTimedOut({
        status: "RUNNING",
        timeoutAt: new Date(Date.now() - 1000),
      }),
      true,
    );
    assert.equal(
      isAcquisitionJobTimedOut({
        status: "SUCCEEDED",
        timeoutAt: new Date(Date.now() - 1000),
      }),
      false,
    );
  });
});
