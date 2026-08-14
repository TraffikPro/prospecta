import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";

import { getOperationalWeek } from "@/features/portfolio/week";
import { hashPassword } from "@/server/auth/password";
import { PortfolioError, countRecyclableHighPool, setOperatorWeeklyQuota } from "./portfolio.service";
import { getNavigationBadges } from "./navigation-badges.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

const WEEK_NOW = new Date("2026-04-15T18:00:00.000Z");

describe("navigation action badges", { skip: !hasDatabase }, () => {
  const stamp = Date.now().toString(36);
  const adminEmail = `navb-admin-${stamp}@prospecta.test`;
  const memberEmail = `navb-member-${stamp}@prospecta.test`;
  const otherEmail = `navb-other-${stamp}@prospecta.test`;
  let adminId = "";
  let memberId = "";
  let otherId = "";
  const createdLeadIds: string[] = [];

  const week = getOperationalWeek(WEEK_NOW);

  async function createLead(
    ownerId: string,
    label: string,
    qualification: "HIGH" | "MEDIUM" = "HIGH",
  ) {
    const lead = await prisma.lead.create({
      data: {
        companyName: `NavB ${label} ${stamp}`,
        email: `navb-${label}-${stamp}-${Math.random().toString(36).slice(2, 8)}@acme.example`,
        stage: "NEW",
        ownerId,
        intelligence: {
          score: qualification === "HIGH" ? 90 : 55,
          qualification,
          signals: qualification === "HIGH" ? ["NO_WEBSITE"] : [],
        },
      },
    });
    createdLeadIds.push(lead.id);
    return lead;
  }

  async function createPortfolio(userId: string, targetSnapshot: number) {
    return prisma.weeklyPortfolio.create({
      data: {
        userId,
        weekStartAt: week.weekStartAt,
        weekEndAt: week.weekEndAt,
        targetSnapshot,
      },
    });
  }

  async function createAssignment(input: {
    leadId: string;
    assigneeId: string;
    portfolioId: string;
    source: "NEW_ACQUISITION" | "RECYCLED" | "MANUAL_ADMIN";
    status: "ACTIVE" | "TREATED" | "RELEASED";
    releaseReason?: string | null;
    treatedAt?: Date | null;
  }) {
    return prisma.leadAssignment.create({
      data: {
        leadId: input.leadId,
        assigneeId: input.assigneeId,
        assignedById: adminId,
        portfolioId: input.portfolioId,
        weekStartAt: week.weekStartAt,
        source: input.source,
        status: input.status,
        dueAt: week.weekEndAt,
        treatedAt: input.treatedAt ?? null,
        releasedAt: input.status === "RELEASED" ? WEEK_NOW : null,
        releaseReason: input.releaseReason ?? null,
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
        name: "NavB Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("NavBAdmin123!"),
        isActive: true,
      },
    });
    adminId = admin.id;
    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        name: "NavB Member",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("NavBMember123!"),
        isActive: true,
      },
    });
    memberId = member.id;
    const other = await prisma.user.create({
      data: {
        email: otherEmail,
        name: "NavB Other",
        role: "MEMBER",
        canRunAcquisition: true,
        passwordHash: await hashPassword("NavBOther123!"),
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
      weeklyTarget: 5,
    });

    const memberPortfolio = await createPortfolio(memberId, 5);
    const otherPortfolio = await createPortfolio(otherId, 5);
    const treatedAt = new Date("2026-04-15T15:00:00.000Z");

    const pendingA = await createLead(memberId, "pending-a");
    const pendingB = await createLead(memberId, "pending-b");
    const pendingC = await createLead(memberId, "pending-c");
    const treatedOwn = await createLead(memberId, "treated");
    const otherPending = await createLead(otherId, "other-pending");
    const recyclable = await createLead(memberId, "recyclable");
    const weekClosed = await createLead(memberId, "week-closed");
    await createAssignment({
      leadId: weekClosed.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "NEW_ACQUISITION",
      status: "RELEASED",
      releaseReason: "WEEK_CLOSED",
    });
    const capped = await createLead(memberId, "capped");
    await createLead(memberId, "medium", "MEDIUM");

    await createAssignment({
      leadId: pendingA.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "NEW_ACQUISITION",
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: pendingB.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "RECYCLED",
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: pendingC.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "MANUAL_ADMIN",
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: treatedOwn.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "NEW_ACQUISITION",
      status: "TREATED",
      treatedAt,
    });
    await createAssignment({
      leadId: otherPending.id,
      assigneeId: otherId,
      portfolioId: otherPortfolio.id,
      source: "NEW_ACQUISITION",
      status: "ACTIVE",
    });
    await createAssignment({
      leadId: recyclable.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "NEW_ACQUISITION",
      status: "TREATED",
      treatedAt,
    });
    await createAssignment({
      leadId: capped.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "NEW_ACQUISITION",
      status: "RELEASED",
      releaseReason: "RECYCLED",
      treatedAt,
    });
    await createAssignment({
      leadId: capped.id,
      assigneeId: memberId,
      portfolioId: memberPortfolio.id,
      source: "RECYCLED",
      status: "TREATED",
      treatedAt,
    });

    await createLead(memberId, "eligible");
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

  it("MEMBER pending uses own ACTIVE assignments and omits highReview", async () => {
    const badges = await getNavigationBadges({
      actorId: memberId,
      now: WEEK_NOW,
    });
    assert.equal(badges.myQueue, 3);
    assert.equal("highReview" in badges, false);
    assert.equal(JSON.stringify(badges).includes("highReview"), false);

    await assert.rejects(
      () => countRecyclableHighPool(memberId),
      PortfolioError,
    );
  });

  it("ADMIN Minha fila is the own portfolio, not team.pending", async () => {
    const badges = await getNavigationBadges({
      actorId: adminId,
      now: WEEK_NOW,
    });
    assert.equal(badges.myQueue, 0);
    assert.ok(typeof badges.highReview === "number");
    assert.equal(badges.highReview, 2);
  });

  it("recyclable count uses F2: TREATED waits, eligible and capped do not", async () => {
    const count = await countRecyclableHighPool(adminId);
    assert.equal(count, 2);
  });

  it("does not mutate operational rows when the shell loads badges", async () => {
    const before = await scopedSnapshot();
    await getNavigationBadges({ actorId: memberId, now: WEEK_NOW });
    await getNavigationBadges({ actorId: adminId, now: WEEK_NOW });
    const after = await scopedSnapshot();
    assert.deepEqual(after, before);
  });
});
