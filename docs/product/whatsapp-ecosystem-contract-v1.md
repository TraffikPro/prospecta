# WhatsApp ecosystem contract v1

- **Version:** `prospecta.whatsapp.v1`
- **Status:** proposed (authorized by [readiness decision](product-decision-whatsapp-ecosystem-readiness-v1.md); **not implemented**)
- **Date:** 2026-08-18
- **Systems:** Lead Generator (acquisition only) → Prospecta (eligibility + CRM) ↔ DevFlow (WhatsApp inbox)
- **Breaking changes:** bump `prospecta.whatsapp.v1` → `v2`; do not silently extend required fields

This file is the shared contract. Copy types into Prospecta and DevFlow; do not diverge.

**Not live.** Flags default `false`. No real sends. No production callbacks.

---

## Topology

```text
Lead Generator          Prospecta                     DevFlow
collect/qualify/sync    eligibility + pipeline        Meta Cloud API
        │                      │                            │
        │  POST /api/internal/leads (existing)              │
        └─────────────────────►│                            │
                               │  signed link / template    │
                               ├───────────────────────────►│
                               │  signed events             │
                               │◄───────────────────────────┤
                               │                            │
operator: outcome + next step  │     operator: conversation │
```

Lead Generator **does not** send WhatsApp and **does not** store consent.

Prospecta V1 remains **single-tenant**. `tenantId` is the DevFlow tenant (from env), not a Prospecta `Tenant` row.

---

## Contact payload (Prospecta → DevFlow)

```ts
type WhatsAppConsentStatus = "UNKNOWN" | "OPTED_IN" | "OPTED_OUT";

type WhatsAppConsentSource =
  | "PHONE_CALL"
  | "EMAIL"
  | "FORM"
  | "INBOUND_WHATSAPP"
  | "OTHER";

type ProspectaWhatsAppConsent = {
  status: WhatsAppConsentStatus;
  source?: WhatsAppConsentSource;
  grantedAt?: string; // ISO-8601
  optedOutAt?: string; // ISO-8601
  purpose?: string;
};

type ProspectaWhatsAppContact = {
  contractVersion: "prospecta.whatsapp.v1";
  prospectaLeadId: string;
  tenantId: string;
  phoneE164: string;
  ownerId: string;
  campaign?: string;
  consent: ProspectaWhatsAppConsent;
};
```

### Rules

| Consent | API send | Link thread |
| --- | --- | --- |
| `UNKNOWN` | deny | deny (except inbound confirmation flow) |
| `OPTED_IN` | allow if flags + template allow | allow |
| `OPTED_OUT` | deny always | keep existing link; no new sends |

- Google Places / generator phone ⇒ `UNKNOWN`. Never infer opt-in from a public listing.
- Invalid / non-E.164 phone ⇒ no link, no send.
- `campaign` is the existing JSON slug (`intelligence.campaign`), not a Campaign entity.

---

## Return events (DevFlow → Prospecta)

```ts
type ProspectaWhatsAppEventType =
  | "CONVERSATION_LINKED"
  | "MESSAGE_ACCEPTED"
  | "MESSAGE_DELIVERED"
  | "MESSAGE_READ"
  | "MESSAGE_FAILED"
  | "INBOUND_MESSAGE"
  | "OPT_OUT";

type ProspectaWhatsAppEvent = {
  contractVersion: "prospecta.whatsapp.v1";
  eventId: string;
  type: ProspectaWhatsAppEventType;
  prospectaLeadId: string;
  whatsappThreadId: string;
  providerMessageId?: string;
  occurredAt: string; // ISO-8601
  payload?: Record<string, unknown>;
};
```

All events **must** carry: `eventId`, `prospectaLeadId`, `whatsappThreadId`, `occurredAt`.  
`providerMessageId` is required for message-level types (`MESSAGE_*`, `INBOUND_MESSAGE`); optional for `CONVERSATION_LINKED` / `OPT_OUT`.

`eventId` is the idempotency key. Replaying the same id must not create a second Activity.

### Mapping (CRM)

| Event | Prospecta |
| --- | --- |
| `CONVERSATION_LINKED` | persist thread ref; no commercial outcome |
| `MESSAGE_ACCEPTED` | technical Activity or metadata (system origin) |
| `MESSAGE_DELIVERED` | metadata only |
| `MESSAGE_READ` | metadata only |
| `MESSAGE_FAILED` | operational alert; no `LOST` |
| `INBOUND_MESSAGE` | inbound Activity (system origin); **no** auto `REPLIED` commercial close |
| `OPT_OUT` | `OPTED_OUT` immediately; block sends |

Do **not** auto-set `INTERESTED`, `NOT_INTERESTED`, `WON`, or `LOST` from message text. The operator confirms outcome.

---

## Identity (DevFlow)

```ts
type ProspectaConversationLink = {
  tenantId: string;
  prospectaLeadId: string;
  threadId: string;
  phoneE164: string;
  createdAt: string;
  updatedAt: string;
};
```

Constraints:

- unique `(tenantId, prospectaLeadId)`;
- unique linked `threadId`;
- phone match requires **explicit confirmation** (no silent merge);
- never create a second thread for the same lead without operator action;
- do not copy score, stage, or pipeline into DevFlow.

Suggested DevFlow UI chrome (not a Prospecta screen):

```text
Origem: Prospecta
Lead: {companyName}
Campanha: {campaign slug}
[Abrir no Prospecta]
```

Do not put real PII in docs/screenshots.

---

## HTTP (server-to-server only)

Never call these from the browser. Never reuse `PROSPECTA_IMPORT_TOKEN`.

### DevFlow (examples)

```text
POST /api/internal/prospecta/conversations/link
GET  /api/internal/prospecta/conversations/by-lead/:leadId
POST /api/internal/prospecta/messages/template
```

### Prospecta (example)

```text
POST /api/internal/whatsapp/events
```

### Auth envelope

Independent secret from lead ingest. Recommended headers:

```text
Authorization: Bearer <PROSPECTA_WHATSAPP_TOKEN>
X-Prospecta-Timestamp: <unix seconds>
X-Prospecta-Nonce: <unique>
X-Prospecta-Signature: sha256=<hex HMAC>
Idempotency-Key: <eventId or client key>
```

Signature input (canonical, UTF-8):

```text
{timestamp}.{nonce}.{rawBody}
```

HMAC-SHA256 with `PROSPECTA_WHATSAPP_SIGNING_SECRET`. Reject if:

- bearer missing/wrong;
- timestamp skew > 5 minutes (replay);
- signature mismatch;
- nonce/`Idempotency-Key` already processed (where applicable).

Also: origin allowlist when the platform allows; rate limit; logs **without** tokens, raw message bodies, or full phone numbers (mask). Document secret rotation in the [runbook](whatsapp-operations-runbook.md).

---

## Templates (DevFlow)

```ts
type SendTemplateInput = {
  to: string; // E.164
  templateName: string;
  language: string;
  components?: unknown;
};

// Conceptual — implement in DevFlow, not in Prospecta:
// sendTemplate(input: SendTemplateInput): Promise<{ providerMessageId: string }>
```

Persist on send attempt (Prospecta and/or DevFlow, slice C):

- template name + language;
- version;
- variables used;
- message snapshot;
- consent snapshot that authorized the send;
- Meta category;
- provider / Meta message id.

No personal-looking template for cold outreach without `OPTED_IN`.

---

## Feature flags

```text
WHATSAPP_INTEGRATION_ENABLED=false
WHATSAPP_TEMPLATE_SEND_ENABLED=false
WHATSAPP_EVENT_SYNC_ENABLED=false
```

Production: all `false` until Go-Live grill.  
Staging: enable only the flags under test, with number allowlist.

`WHATSAPP_TEMPLATE_SEND_ENABLED` requires `WHATSAPP_INTEGRATION_ENABLED`.  
`WHATSAPP_EVENT_SYNC_ENABLED` may be on in staging without send, to test inbound/webhooks.

---

## Test matrix (required before go-live)

### Contract

- valid payload;
- invalid signature;
- repeated `eventId`;
- expired timestamp;
- unknown `prospectaLeadId`;
- thread already linked.

### Consent

- `UNKNOWN` blocks send;
- `OPTED_IN` allows the path;
- `OPTED_OUT` blocks even with a thread;
- later opt-out stops new sends;
- invalid phone does not create a link.

### Messages

- template accepted;
- template rejected;
- delivered / read;
- failed;
- inbound reply;
- duplicate webhook ⇒ no duplicate Activity.

### E2E (staging only)

```text
Eligible lead in Prospecta
→ link conversation
→ send approved template (allowlisted number)
→ receive status
→ receive reply
→ Activity in Prospecta (system origin)
→ open thread in DevFlow
→ human records outcome
```

---

## Out of contract v1

- Cadence scheduler (D0/D2/D5/D9)
- Bulk send
- Browser SDK
- Multi-tenant Prospecta
- Automatic commercial stage from NLP
