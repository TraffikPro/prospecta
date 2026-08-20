import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { AuthorizationError } from "@/server/auth/errors";
import { hashPassword } from "@/server/auth/password";
import { WhatsAppConsentValidationError } from "@/features/whatsapp-consent/consent.errors";
import { assertSafeForMutableTestsOrThrow } from "@/lib/safety/production-mutation-guard";
import {
  applyWhatsAppConsentState,
  createWhatsAppConsentEvent,
} from "@/server/repositories/whatsapp-consent.repository";
import { recordWhatsAppConsent } from "./whatsapp-consent.service";

const prisma = new PrismaClient();
const hasDatabase = Boolean(process.env.DATABASE_URL);

describe("recordWhatsAppConsent", { skip: !hasDatabase }, () => {
  const suffix = Date.now().toString(36);
  let ownerId = "";
  let otherId = "";
  let adminId = "";
  let leadId = "";

  before(async () => {
    assertSafeForMutableTestsOrThrow({
      databaseUrl: process.env.DATABASE_URL,
    });
    const owner = await prisma.user.upsert({
      where: { email: `wa-consent-owner-${suffix}@prospecta.test` },
      update: { isActive: true },
      create: {
        email: `wa-consent-owner-${suffix}@prospecta.test`,
        name: "Consent Owner",
        role: "MEMBER",
        passwordHash: await hashPassword("ConsentTest123!"),
        isActive: true,
      },
    });
    ownerId = owner.id;

    const other = await prisma.user.upsert({
      where: { email: `wa-consent-other-${suffix}@prospecta.test` },
      update: { isActive: true },
      create: {
        email: `wa-consent-other-${suffix}@prospecta.test`,
        name: "Other Member",
        role: "MEMBER",
        passwordHash: await hashPassword("ConsentTest123!"),
        isActive: true,
      },
    });
    otherId = other.id;

    const admin = await prisma.user.upsert({
      where: { email: `wa-consent-admin-${suffix}@prospecta.test` },
      update: { isActive: true, role: "ADMIN" },
      create: {
        email: `wa-consent-admin-${suffix}@prospecta.test`,
        name: "Consent Admin",
        role: "ADMIN",
        passwordHash: await hashPassword("ConsentTest123!"),
        isActive: true,
      },
    });
    adminId = admin.id;

    const lead = await prisma.lead.create({
      data: {
        companyName: `Clínica Consent ${suffix}`,
        phone: "13988887777",
        source: "GOOGLE_PLACES",
        externalId: `wa-consent-${suffix}`,
        ownerId,
      },
    });
    leadId = lead.id;
  });

  after(async () => {
    await prisma.lead.deleteMany({ where: { ownerId } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            `wa-consent-owner-${suffix}@prospecta.test`,
            `wa-consent-other-${suffix}@prospecta.test`,
            `wa-consent-admin-${suffix}@prospecta.test`,
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  it("starts UNKNOWN with null E.164 even when Places has a phone", async () => {
    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    assert.equal(lead.whatsappConsentStatus, "UNKNOWN");
    assert.equal(lead.phoneE164, null);
    const events = await prisma.whatsAppConsentEvent.count({
      where: { leadId },
    });
    assert.equal(events, 0);
  });

  it("rejects OPTED_IN without E.164 and does not infer consent from legacy phone", async () => {
    await assert.rejects(
      () =>
        recordWhatsAppConsent({
          leadId,
          actorId: ownerId,
          status: "OPTED_IN",
          source: "PHONE_CALL",
          purpose: "PRESENTATION",
          evidenceAt: new Date().toISOString(),
        }),
      WhatsAppConsentValidationError,
    );
    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    assert.equal(lead.whatsappConsentStatus, "UNKNOWN");
    assert.equal(lead.phoneE164, null);
  });

  it("records UNKNOWN → OPTED_IN → OPTED_OUT → OPTED_IN as three immutable events", async () => {
    const t1 = new Date();
    const t2 = new Date(t1.getTime() + 60_000);
    const t3 = new Date(t2.getTime() + 60_000);

    await recordWhatsAppConsent({
      leadId,
      actorId: ownerId,
      status: "OPTED_IN",
      source: "PHONE_CALL",
      purpose: "PRESENTATION",
      evidenceAt: t1.toISOString(),
      phoneE164: "+5513988887777",
    });

    await recordWhatsAppConsent({
      leadId,
      actorId: ownerId,
      status: "OPTED_OUT",
      source: "INBOUND_WHATSAPP",
      evidenceAt: t2.toISOString(),
    });

    await recordWhatsAppConsent({
      leadId,
      actorId: ownerId,
      status: "OPTED_IN",
      source: "EMAIL",
      purpose: "MEETING",
      evidenceAt: t3.toISOString(),
      phoneE164: "+5513988887777",
    });

    const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
    assert.equal(lead.whatsappConsentStatus, "OPTED_IN");
    assert.equal(lead.phoneE164, "+5513988887777");

    const events = await prisma.whatsAppConsentEvent.findMany({
      where: { leadId },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(events.length, 3);
    assert.deepEqual(
      events.map((event) => event.status),
      ["OPTED_IN", "OPTED_OUT", "OPTED_IN"],
    );
    assert.equal(events[0]?.source, "PHONE_CALL");
    assert.equal(events[0]?.purpose, "PRESENTATION");
    assert.equal(events[1]?.status, "OPTED_OUT");
    assert.equal(events[2]?.purpose, "MEETING");
    assert.notEqual(events[0]?.id, events[2]?.id);
    assert.ok(events[0]!.evidenceAt.getTime() < events[1]!.evidenceAt.getTime());
    assert.ok(events[1]!.evidenceAt.getTime() < events[2]!.evidenceAt.getTime());
    assert.notEqual(
      events[0]!.createdAt.getTime(),
      events[0]!.evidenceAt.getTime(),
    );
    assert.equal(events.every((event) => event.actorId === ownerId), true);
  });

  it("rejects a new OPTED_IN after OPTED_OUT when evidenceAt is not newer", async () => {
    const isolated = await prisma.lead.create({
      data: {
        companyName: `Clínica Recusa ${suffix}`,
        phone: "13977776666",
        ownerId,
      },
    });
    const refusedAt = new Date();
    await recordWhatsAppConsent({
      leadId: isolated.id,
      actorId: ownerId,
      status: "OPTED_IN",
      source: "PHONE_CALL",
      purpose: "DEMO",
      evidenceAt: refusedAt.toISOString(),
      phoneE164: "+5513977776666",
    });
    await recordWhatsAppConsent({
      leadId: isolated.id,
      actorId: ownerId,
      status: "OPTED_OUT",
      source: "OTHER",
      evidenceAt: new Date(refusedAt.getTime() + 60_000).toISOString(),
    });

    await assert.rejects(
      () =>
        recordWhatsAppConsent({
          leadId: isolated.id,
          actorId: ownerId,
          status: "OPTED_IN",
          source: "FORM",
          purpose: "DEMO",
          evidenceAt: refusedAt.toISOString(),
          phoneE164: "+5513977776666",
        }),
      WhatsAppConsentValidationError,
    );

    const events = await prisma.whatsAppConsentEvent.count({
      where: { leadId: isolated.id },
    });
    assert.equal(events, 2);
    await prisma.lead.delete({ where: { id: isolated.id } });
  });

  it("forbids another MEMBER from recording consent on a lead they do not own", async () => {
    await assert.rejects(
      () =>
        recordWhatsAppConsent({
          leadId,
          actorId: otherId,
          status: "OPTED_OUT",
          source: "OTHER",
          evidenceAt: new Date().toISOString(),
        }),
      AuthorizationError,
    );
  });

  it("allows ADMIN to record consent on a lead they do not own", async () => {
    const adminLead = await prisma.lead.create({
      data: {
        companyName: `Clínica Admin ${suffix}`,
        phone: "13966665555",
        ownerId,
      },
    });
    await recordWhatsAppConsent({
      leadId: adminLead.id,
      actorId: adminId,
      status: "OPTED_OUT",
      source: "PHONE_CALL",
      evidenceAt: new Date().toISOString(),
    });
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: adminLead.id },
    });
    assert.equal(lead.whatsappConsentStatus, "OPTED_OUT");
    const event = await prisma.whatsAppConsentEvent.findFirstOrThrow({
      where: { leadId: adminLead.id },
    });
    assert.equal(event.actorId, adminId);
    assert.ok(event.evidenceAt);
    assert.ok(event.createdAt);
  });

  it("rolls back lead state when the consent event insert fails", async () => {
    const isolated = await prisma.lead.create({
      data: {
        companyName: `Clínica Rollback ${suffix}`,
        phone: "13955554444",
        ownerId,
      },
    });

    await assert.rejects(() =>
      prisma.$transaction(async (tx) => {
        await createWhatsAppConsentEvent(
          {
            leadId: isolated.id,
            status: "OPTED_IN",
            source: "PHONE_CALL",
            purpose: "PRESENTATION",
            purposeNote: null,
            evidenceAt: new Date(),
            actorId: "missing-actor",
          },
          tx,
        );
        await applyWhatsAppConsentState(
          {
            leadId: isolated.id,
            status: "OPTED_IN",
            phoneE164: "+5513955554444",
          },
          tx,
        );
      }),
    );

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: isolated.id },
    });
    assert.equal(lead.whatsappConsentStatus, "UNKNOWN");
    assert.equal(lead.phoneE164, null);
    assert.equal(
      await prisma.whatsAppConsentEvent.count({ where: { leadId: isolated.id } }),
      0,
    );
  });

  it("rolls back the event if updating current lead state fails", async () => {
    const isolated = await prisma.lead.create({
      data: {
        companyName: `Clínica Rollback State ${suffix}`,
        phone: "13944443333",
        ownerId,
      },
    });

    await assert.rejects(() =>
      prisma.$transaction(async (tx) => {
        await createWhatsAppConsentEvent(
          {
            leadId: isolated.id,
            status: "OPTED_IN",
            source: "EMAIL",
            purpose: "MEETING",
            purposeNote: null,
            evidenceAt: new Date(),
            actorId: ownerId,
          },
          tx,
        );
        await applyWhatsAppConsentState(
          {
            leadId: "missing-lead",
            status: "OPTED_IN",
            phoneE164: "+5513944443333",
          },
          tx,
        );
      }),
    );

    assert.equal(
      await prisma.whatsAppConsentEvent.count({ where: { leadId: isolated.id } }),
      0,
    );
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: isolated.id },
    });
    assert.equal(lead.whatsappConsentStatus, "UNKNOWN");
  });

  it("serializes concurrent writes so Lead status matches the latest event", async () => {
    const isolated = await prisma.lead.create({
      data: {
        companyName: `Clínica Race ${suffix}`,
        phone: "13933332222",
        ownerId,
      },
    });
    const optedOutAt = new Date();
    const optedInAt = new Date(optedOutAt.getTime() + 60_000);

    await Promise.all([
      recordWhatsAppConsent({
        leadId: isolated.id,
        actorId: ownerId,
        status: "OPTED_IN",
        source: "PHONE_CALL",
        purpose: "PRESENTATION",
        evidenceAt: optedInAt.toISOString(),
        phoneE164: "+5513933332222",
      }),
      recordWhatsAppConsent({
        leadId: isolated.id,
        actorId: ownerId,
        status: "OPTED_OUT",
        source: "OTHER",
        evidenceAt: optedOutAt.toISOString(),
      }),
    ]);

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: isolated.id },
    });
    const events = await prisma.whatsAppConsentEvent.findMany({
      where: { leadId: isolated.id },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(events.length, 2);
    const latest = events[1]!;
    assert.equal(lead.whatsappConsentStatus, latest.status);
  });
});
