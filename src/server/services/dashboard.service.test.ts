import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { getOperationalWeek } from "@/features/portfolio/week";
import { AuthorizationError } from "@/server/auth/errors";
import { hashPassword } from "@/server/auth/password";
import { getCommercialWeeklyKpis } from "./commercial-kpi.service";
import { getOperationalDashboard } from "./dashboard.service";
import { setOperatorWeeklyQuota } from "./portfolio.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

const WEEK_NOW = new Date("2026-03-11T18:00:00.000Z");

describe("operational dashboard loader", { skip: !hasDatabase }, () => {
  const stamp = Date.now().toString(36);
  const adminEmail = `dash-admin-${stamp}@prospecta.test`;
  const memberEmail = `dash-member-${stamp}@prospecta.test`;
  const otherEmail = `dash-other-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let otherId = "";
  const createdLeadIds: string[] = [];

  const week = getOperationalWeek(WEEK_NOW);

  async function createLead(ownerId: string, label: string) {
    const lead = await prisma.lead.create({
      data: {
        companyName: `Dash ${label} ${stamp}`,
        email: `dash-${label}-${stamp}-${Math.random().toString(36).slice(2, 8)}@acme.example`,
        stage: "NEW",
        ownerId,
        intelligence: {
          score: 90,
          qualification: "HIGH",
          signals: ["NO_WEBSITE"],
        },
      },
    });
    createdLeadIds.push(lead.id);
    return lead;
  }

  async function createPortfolio(
    userId: string,
    targetSnapshot: number,
  ) {
    return prisma.weeklyPortfolio.create({
      data: {
        userId,
        weekStartAt: week.weekStartAt,
        weekEndAt: week.weekEndAt,
        targetSnapshot,
      },
    });
  }

  async function scopedSnapshot() {
    const userIds = [adminId, memberId, otherId];
    const [portfolios, assignments, jobs, activities, quotas] =
      await Promise.all([
        prisma.weeklyPortfolio.count({ where: { userId: { in: userIds } } }),
        prisma.leadAssignment.count({
          where: { assigneeId: { in: userIds } },
        }),
        prisma.acquisitionJob.count({
          where: { requestedById: { in: userIds } },
        }),
        prisma.activity.count({ where: { authorId: { in: userIds } } }),
        prisma.operatorWeeklyQuota.count({
          where: { userId: { in: userIds } },
        }),
      ]);
    return { portfolios, assignments, jobs, activities, quotas };
  }

  before(async () => {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Dash Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("DashAdmin123!"),
        isActive: true,
      },
    });
    adminId = admin.id;
    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        name: "Dash Member",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("DashMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;
    const other = await prisma.user.create({
      data: {
        email: otherEmail,
        name: "Dash Other",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("DashOther123!"),
        isActive: true,
      },
    });
    otherId = other.id;

    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: memberId,
      weeklyTarget: 5,
    });
    await setOperatorWeeklyQuota({
      actorId: adminId,
      targetUserId: otherId,
      weeklyTarget: 3,
    });

    const memberPortfolio = await createPortfolio(memberId, 5);
    const otherPortfolio = await createPortfolio(otherId, 3);
    const memberLeadA = await createLead(memberId, "a");
    const memberLeadB = await createLead(memberId, "b");
    const otherLead = await createLead(otherId, "c");
    const treatedAt = new Date("2026-03-11T15:00:00.000Z");

    await prisma.leadAssignment.create({
      data: {
        leadId: memberLeadA.id,
        assigneeId: memberId,
        assignedById: adminId,
        portfolioId: memberPortfolio.id,
        weekStartAt: week.weekStartAt,
        source: "NEW_ACQUISITION",
        status: "TREATED",
        dueAt: week.weekEndAt,
        treatedAt,
      },
    });
    await prisma.leadAssignment.create({
      data: {
        leadId: memberLeadB.id,
        assigneeId: memberId,
        assignedById: adminId,
        portfolioId: memberPortfolio.id,
        weekStartAt: week.weekStartAt,
        source: "RECYCLED",
        status: "ACTIVE",
        dueAt: week.weekEndAt,
      },
    });
    await prisma.leadAssignment.create({
      data: {
        leadId: otherLead.id,
        assigneeId: otherId,
        assignedById: adminId,
        portfolioId: otherPortfolio.id,
        weekStartAt: week.weekStartAt,
        source: "MANUAL_ADMIN",
        status: "ACTIVE",
        dueAt: week.weekEndAt,
      },
    });
  });

  after(async () => {
    await prisma.leadAssignment.deleteMany({
      where: { leadId: { in: createdLeadIds } },
    });
    await prisma.weeklyPortfolio.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.operatorWeeklyQuota.deleteMany({
      where: { userId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.adminAuditEvent.deleteMany({
      where: { actorId: { in: [adminId, memberId, otherId] } },
    });
    await prisma.lead.deleteMany({ where: { id: { in: createdLeadIds } } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, memberId, otherId] } },
    });
    await prisma.$disconnect();
  });

  it("returns the operator snapshot for MEMBER and never the team aggregate", async () => {
    const dashboard = await getOperationalDashboard({
      actorId: memberId,
      now: WEEK_NOW,
    });
    assert.equal(dashboard.kind, "operator");
    assert.equal(dashboard.kpis.target, 5);
    assert.equal(dashboard.kpis.assigned, 2);
    assert.equal(dashboard.kpis.treated, 1);
    assert.equal(dashboard.kpis.pending, 1);
    assert.equal(dashboard.kpis.treatmentRate, 0.5);
    assert.equal(dashboard.kpis.bySource.newAcquisition, 1);
    assert.equal(dashboard.kpis.bySource.recycled, 1);
    assert.equal("operatorsTotal" in dashboard.kpis, false);

    await assert.rejects(
      () => getCommercialWeeklyKpis({ actorId: memberId, now: WEEK_NOW }),
      AuthorizationError,
    );
  });

  it("returns summed team KPIs for ADMIN instead of averaged operator rates", async () => {
    const dashboard = await getOperationalDashboard({
      actorId: adminId,
      now: WEEK_NOW,
    });
    assert.equal(dashboard.kind, "team");
    assert.equal(dashboard.kpis.assigned, 3);
    assert.equal(dashboard.kpis.treated, 1);
    assert.equal(dashboard.kpis.pending, 2);
    assert.equal(dashboard.kpis.treatmentRate, 1 / 3);
    assert.notEqual(dashboard.kpis.treatmentRate, (0.5 + 0) / 2);
    assert.ok(dashboard.kpis.operatorsTotal >= 2);
    assert.ok(dashboard.kpis.operatorsWithQuota >= 2);
  });

  it("does not mutate portfolio, assignment, job or activity when opened", async () => {
    const before = await scopedSnapshot();
    await getOperationalDashboard({ actorId: memberId, now: WEEK_NOW });
    await getOperationalDashboard({ actorId: adminId, now: WEEK_NOW });
    const after = await scopedSnapshot();
    assert.deepEqual(after, before);
  });
});
