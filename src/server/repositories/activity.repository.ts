import type {
  Activity,
  ActivityOutcome,
  ActivityType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ActivityWithAuthor = Activity & {
  author: {
    id: string;
    name: string;
    email: string;
  };
};

export type CreateActivityData = {
  leadId: string;
  authorId: string;
  type: ActivityType;
  outcome?: ActivityOutcome | null;
  body: string;
};

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function createActivity(
  data: CreateActivityData,
  db: DbClient = prisma,
): Promise<Activity> {
  return db.activity.create({
    data: {
      leadId: data.leadId,
      authorId: data.authorId,
      type: data.type,
      outcome: data.outcome ?? null,
      body: data.body,
    },
  });
}

export async function countOutreachByLeadId(
  leadId: string,
  db: DbClient = prisma,
): Promise<number> {
  return db.activity.count({
    where: {
      leadId,
      type: { in: ["WHATSAPP", "EMAIL"] },
    },
  });
}

export async function listActivitiesByLeadId(
  leadId: string,
): Promise<ActivityWithAuthor[]> {
  return prisma.activity.findMany({
    where: { leadId },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
