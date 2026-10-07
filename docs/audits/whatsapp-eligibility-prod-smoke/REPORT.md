# Production smoke — WhatsApp contact eligibility

- **Date:** 2026-10-07 (America/Sao_Paulo)
- **App:** `https://prospecta-ten-tau.vercel.app`
- **Script:** `scripts/smoke-whatsapp-eligibility-prod.mjs`
- **Actor:** seed `comercial@prospecta.test` (password via env; never logged)
- **DB:** Neon production fingerprint `50218bdd86d8` (cleanup with break-glass only)

## Preconditions

- `#69` merged + `prisma migrate deploy` applied (`20260818190000_whatsapp_contact_eligibility`)
- Feature flags for WhatsApp **send** remain off

## Result

**OVERALL PASS (9/9)**

| Check | Result |
| --- | --- |
| login member | PASS |
| create lead with phone | PASS (synthetic; deleted) |
| eligibility UNKNOWN + no Enviar | PASS |
| manual wa.me Abrir WhatsApp | PASS |
| opt-in → OPTED_IN | PASS |
| opt-in survives reload | PASS |
| no Meta/DevFlow outbound | PASS |
| mobile no horizontal overflow | PASS |
| cleanup smoke lead | PASS |

## Notes

- Label of manual handoff is **Abrir WhatsApp** (CORE UI/UX #83); e2e updated accordingly.
- Smoke does **not** count as Sprint 0 commercial evidence (no Santos Activity).
