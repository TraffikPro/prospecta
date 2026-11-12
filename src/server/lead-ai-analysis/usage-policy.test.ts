import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { assertAuthorizedTestDatabase } from "@/lib/safety/test-database-gate";
import { createAnalysisStore } from "./repository";
import { AnalysisAccessError } from "./contracts";

assertAuthorizedTestDatabase(process.env.DATABASE_URL);
const db = new PrismaClient(); const users: string[] = []; const leads: string[] = [];
after(async () => {
  await db.leadAIAnalysis.deleteMany({ where: { requestedById: { in: users } } });
  await db.lead.deleteMany({ where: { id: { in: leads } } });
  await db.user.deleteMany({ where: { id: { in: users } } }); await db.$disconnect();
});
async function fixtures(n: number) {
  const actor = await db.user.create({ data: { email: `quota-ai-${randomUUID()}@prospecta.test`, name: "Fixture", passwordHash: "not-a-password" } });
  users.push(actor.id); const ids = [];
  for (let i = 0; i < n; i++) { const lead = await db.lead.create({ data: { companyName: "Fixture", ownerId: actor.id } }); leads.push(lead.id); ids.push(lead.id); }
  return { actorId: actor.id, ids };
}
it("concurrent requests on different leads share a durable user quota", async () => {
  const { actorId, ids } = await fixtures(11); const store = createAnalysisStore(db);
  const requests = ids.map((leadId) => ({ leadId, actorId, requestKey: randomUUID() }));
  const results = await Promise.allSettled(requests.map((input) => store.claim(input)));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 10);
  const failure = results.find((r) => r.status === "rejected");
  assert.ok(failure?.status === "rejected" && failure.reason instanceof AnalysisAccessError && failure.reason.code === "RATE_LIMITED");
  const successIndex = results.findIndex((r) => r.status === "fulfilled");
  assert.equal((await store.claim(requests[successIndex])).kind, "replay");
  assert.equal(await db.leadAIAnalysis.count({ where: { requestedById: actorId } }), 10);
});
it("daily budget includes failed runs even after the hourly window", async () => {
  const { actorId, ids } = await fixtures(1);
  await db.leadAIAnalysis.createMany({ data: Array.from({ length: 30 }, () => ({
    leadId: ids[0], requestedById: actorId, requestKey: randomUUID(), status: "FAILED" as const,
    expiresAt: new Date(0), createdAt: new Date(Date.now() - 2 * 3_600_000),
  })) });
  await assert.rejects(createAnalysisStore(db).claim({ leadId: ids[0], actorId, requestKey: randomUUID() }),
    (e: unknown) => e instanceof AnalysisAccessError && e.code === "RATE_LIMITED");
});
