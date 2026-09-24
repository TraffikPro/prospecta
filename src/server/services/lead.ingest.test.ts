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

  it("rejects duplicate email with different externalId", async () => {
    const stamp = Date.now();
    const email = `dup-email-${stamp}@example.test`;
    await ingestExternalLead({
      companyName: "Empresa Email A",
      email,
      phone: `11977${String(stamp).slice(-6)}`,
      source: "GOOGLE_PLACES",
      externalId: `place_email_a_${stamp}`,
      ownerEmail,
    });

    await assert.rejects(
      () =>
        ingestExternalLead({
          companyName: "Empresa Email B",
          email,
          phone: `11966${String(stamp).slice(-6)}`,
          source: "GOOGLE_PLACES",
          externalId: `place_email_b_${stamp}`,
          ownerEmail,
        }),
      (error: unknown) => error instanceof LeadDuplicateError,
    );
  });

  it("same externalId with changed phone still returns existing (idempotent)", async () => {
    const stamp = Date.now();
    const externalId = `place_phone_change_${stamp}`;
    const first = await ingestExternalLead({
      companyName: "Empresa Phone Change",
      phone: `11955${String(stamp).slice(-6)}`,
      source: "GOOGLE_PLACES",
      externalId,
      ownerEmail,
    });
    assert.equal(first.created, true);

    const second = await ingestExternalLead({
      companyName: "Empresa Phone Change",
      phone: `11944${String(stamp).slice(-6)}`,
      source: "GOOGLE_PLACES",
      externalId,
      ownerEmail,
    });
    assert.equal(second.created, false);
    assert.equal(second.id, first.id);

    const count = await prisma.lead.count({
      where: { source: "GOOGLE_PLACES", externalId },
    });
    assert.equal(count, 1);
  });

  it("same externalId with changed companyName still returns existing", async () => {
    const stamp = Date.now();
    const externalId = `place_name_change_${stamp}`;
    const first = await ingestExternalLead({
      companyName: "Nome Original",
      phone: `11933${String(stamp).slice(-6)}`,
      source: "GOOGLE_PLACES",
      externalId,
      ownerEmail,
    });
    const second = await ingestExternalLead({
      companyName: "Nome Alterado",
      phone: `11933${String(stamp).slice(-6)}`,
      source: "GOOGLE_PLACES",
      externalId,
      ownerEmail,
    });
    assert.equal(second.created, false);
    assert.equal(second.id, first.id);
  });

  for (const concurrency of [1, 5, 10, 20] as const) {
    it(`concurrent same externalId ×${concurrency} → 1 created, ${concurrency - 1} existing, 0 errors`, async () => {
      const stamp = Date.now() + concurrency;
      const externalId = `place_conc_${concurrency}_${stamp}`;
      const phone = `1188${String(100000 + concurrency).slice(-2)}${String(stamp).slice(-6)}`;
      const payload = {
        companyName: `Conc Co ${concurrency}`,
        phone,
        website: null as string | null,
        source: "GOOGLE_PLACES" as const,
        externalId,
        ownerEmail,
        intelligence: {
          score: 80,
          qualification: "HIGH" as const,
          signals: ["NO_WEBSITE"],
          pitch: "x",
          summary: "y",
        },
      };

      const results = await Promise.all(
        Array.from({ length: concurrency }, () => ingestExternalLead(payload)),
      );

      const created = results.filter((r) => r.created);
      const existing = results.filter((r) => !r.created);
      assert.equal(created.length, 1);
      assert.equal(existing.length, concurrency - 1);
      assert.ok(results.every((r) => r.id === created[0]!.id));

      const count = await prisma.lead.count({
        where: { source: "GOOGLE_PLACES", externalId },
      });
      assert.equal(count, 1);
    });
  }

  it("10 unique × 10 concurrent → 10 created, 90 existing, 0 errors, 10 rows", async () => {
    const stamp = Date.now();
    const unique = Array.from({ length: 10 }, (_, i) => {
      const externalId = `place_burst_${stamp}_${i}`;
      const phone = `1177${String(i).padStart(2, "0")}${String(stamp).slice(-6)}`;
      return {
        companyName: `Burst Co ${i}`,
        phone,
        website: null as string | null,
        source: "GOOGLE_PLACES" as const,
        externalId,
        ownerEmail,
      };
    });

    const burst = unique.flatMap((payload) =>
      Array.from({ length: 10 }, () => payload),
    );
    const results = await Promise.all(
      burst.map((payload) => ingestExternalLead(payload)),
    );

    assert.equal(results.filter((r) => r.created).length, 10);
    assert.equal(results.filter((r) => !r.created).length, 90);

    for (const payload of unique) {
      const ids = results
        .map((r, idx) =>
          burst[idx]!.externalId === payload.externalId ? r.id : null,
        )
        .filter((id): id is string => Boolean(id));
      assert.equal(ids.length, 10);
      assert.equal(new Set(ids).size, 1);
    }

    const rows = await prisma.lead.count({
      where: {
        source: "GOOGLE_PLACES",
        externalId: { in: unique.map((u) => u.externalId) },
      },
    });
    assert.equal(rows, 10);

    const dupGroups = await prisma.$queryRaw<Array<{ c: bigint }>>`
      SELECT COUNT(*)::bigint AS c FROM (
        SELECT "source", "externalId"
        FROM "Lead"
        WHERE "externalId" = ANY(${unique.map((u) => u.externalId)})
        GROUP BY "source", "externalId"
        HAVING COUNT(*) > 1
      ) d
    `;
    assert.equal(Number(dupGroups[0]?.c ?? 0), 0);
  });
});
