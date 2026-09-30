# F12 — Auth Surfaces / Product Entry

**Date:** 2026-09-29  
**Branch:** `docs/prospecta-ecosystem-engineering-case`  
**Working tree:** F1–F11 preserved + F12 Auth entry presentation; **no commit / no push**.  
**Business logic changed:** **NO**  
**Auth / session / Upstash semantics changed:** **NO**

---

## Product Responsibility

**Auth answers:** “How do I securely enter Prospecta?”

Primary job: **authenticate**.  
Secondary job: establish product identity / trust — without competing with the form.

---

## Auth Surface Map

| Surface | Status | F12 action |
| --- | --- | --- |
| `/login` | **EXISTS** | Redesigned entry shell + copy |
| `/forgot-password` | **EXISTS** | Aligned to same entry pattern |
| `/reset-password` | **EXISTS** | Aligned to same entry pattern |
| `/change-password` (must-change) | **EXISTS** | Task shell aligned (already sober) |
| Logout → `/login` | **EXISTS** | Unchanged semantics |
| Session expired (`?reason=session_expired`) | **EXISTS** | Alert preserved |
| `forbidden.tsx` (403) | **EXISTS** | Authenticated product state — **not redesigned** |
| Signup / invite acceptance | **MISSING** | Not invented |
| Unauthorized dedicated page | **NOT APPLICABLE** | Redirect to login |

---

## Security Freeze

Unchanged:

- `loginAction` / password validation / generic invalid-credential messaging  
- Session cookies / HttpOnly  
- Rate limiting + production Upstash fail-closed  
- Middleware / redirects / `postAuthPath`  
- Password reset anti-enumeration  
- Must-change-password gate  

No bypasses, no hardcoded credentials, no production fallback changes.

---

## Previous Presentation

- Desktop **55/45 marketing split** (`AuthBrandPanel` / `PublicAuthBrandPanel`)
- `bgGradient` brand.800→950, radial dots, `blur(80px)` glow blob
- Hero headline: “Transforme oportunidades em próximas ações.”
- Decorative `PipelineGraphic`
- Dark mobile brand bar (`brand.950`)
- Form H1: “Bem-vindo de volta”

**AI-template hotspot confirmed still present before F12.**

---

## KEEP / CHANGE / REMOVE

| Element | Decision |
| --- | --- |
| ProspectaMark + wordmark | **KEEP** |
| Form fields / labels / Entrar CTA | **KEEP** (behavior) |
| Password visibility toggle | **KEEP** |
| Esqueci minha senha link | **KEEP** |
| Session-expired / error alerts | **KEEP** |
| F2 Input / Button / PasswordInput | **KEEP** |
| Gradient / blur / dots | **REMOVE** |
| PipelineGraphic | **REMOVE** |
| Marketing hero copy | **REMOVE** |
| Split marketing panel | **REMOVE** → centered entry |
| Dark mobile brand stripe | **REMOVE** |
| “Bem-vindo de volta” | **CHANGE** → “Entrar” |

---

## New Presentation

Centered entry (`minH: 100dvh`, `bg.subtle`):

1. Compact `AuthEntryBrand` (mark + Prospecta + DevFlow Labs + short factual context)
2. Outline bordered panel (`radius.surface`, border > shadow)
3. Task-first H1 + factual subtitle + form

Shared pattern across login / forgot / reset / change-password.

---

## Product Identity

Existing `ProspectaMark` SVG (no new logo).  
Context lines:

- Login: “Prospecção B2B founder-led”
- Public recovery: “Recuperação de acesso”

---

## Copy

| Before | After |
| --- | --- |
| Transforme oportunidades… | *(removed)* |
| Bem-vindo de volta | **Entrar** |
| Entre com sua conta… | **Acesse sua operação comercial.** |
| Acesse novamente sua operação. (brand panel) | *(removed from brand)* |

Banned marketing fragments guarded by `auth-entry-copy.test.ts`.

---

## Form

- E-mail (`autocomplete=username`) + Senha (`current-password`) + persistent labels  
- Primary: **Entrar** (loading “Entrando…” preserved)  
- Secondary: Esqueci minha senha  
- No remember-me (does not exist)

---

## Errors

- Invalid credentials: existing generic alert (no account enumeration)  
- Session expired: warning alert preserved  
- Rate-limit / Upstash unavailable: existing server messages unchanged (not restyled beyond shared Alert)

---

## Rate Limit

Visual presentation unchanged for rate-limit messages.  
Production fail-closed Upstash behavior **unchanged**.  
Local QA continues with empty Upstash → memory adapter (F8/F10).

---

## Responsive

| Viewport | Behavior |
| --- | --- |
| Desktop | Centered brand + form (no awkward empty marketing column) |
| Medium | Same hierarchy, ≤400px column |
| Mobile | Form focus; single wordmark; CTA in fold; short-height (560px) checked in E2E |

---

## Accessibility

- Persistent labels  
- Heading hierarchy (H1 Entrar)  
- Alert `role="alert"` / session `role="status"`  
- Password toggle keyboard (existing)  
- Touch `minH="touch"` on controls  
- Autocomplete preserved  

---

## Motion

No Framer Motion on auth. No decorative entrance animation added or needed.

---

## Anti-AI-Template Check

| Category | Result |
| --- | --- |
| Gradient-heavy background | **PASS** (removed) |
| Glow / blur blobs | **PASS** (removed) |
| Glassmorphism | **PASS** (outline panel only) |
| Giant rounded marketing card | **PASS** (moderate `surface` radius) |
| Generic transformation copy | **PASS** |
| Decorative AI icons | **PASS** |
| Marketing hero / pipeline art | **PASS** (removed) |
| Excessive animation | **PASS** |
| Fake metrics / trust claims | **PASS** |

---

## Files Changed

- `src/features/auth/auth-entry-copy.ts` (+ test)
- `src/features/auth/components/auth-entry-brand.tsx` (new)
- `src/features/auth/components/auth-shell.tsx`
- `src/features/auth/components/public-auth-shell.tsx`
- `src/features/auth/components/task-auth-shell.tsx`
- `src/app/login/page.tsx`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- **Removed:** `auth-brand-panel.tsx`, `public-auth-brand-panel.tsx`, `pipeline-graphic.tsx`
- E2E: `login-visual`, `auth-recovery-visual`, `first-access-visual`
- Smoke scripts: `smoke-login-visual-prod.mjs`, `smoke-auth-recovery-visual-prod.mjs`
- Screenshots: `docs/product/assets/ui-v2/auth-*.png`

---

## Tests

| Suite | Result |
| --- | --- |
| typecheck | **PASS** |
| lint | **PASS** (1 pre-existing warning) |
| unit (`npm run test`) | **369** pass |
| build | **PASS** |

---

## E2E

Local Docker `:5433`, empty Upstash, serial workers, existing `next dev`.

**21/21 PASS:** login-visual · auth-recovery-visual · auth · must-change-password · password-reset · first-access-visual

---

## Visual QA

| Viewport / state | Result |
| --- | --- |
| Desktop login | PASS — sober centered entry |
| Medium login | PASS |
| Mobile login | PASS |
| Invalid credentials | PASS (E2E + error screenshot) |
| Forgot password desktop | PASS |

---

## Screenshots

- `docs/product/assets/ui-v2/auth-login-desktop.png`
- `docs/product/assets/ui-v2/auth-login-medium.png`
- `docs/product/assets/ui-v2/auth-login-mobile.png`
- `docs/product/assets/ui-v2/auth-login-error-desktop.png`
- `docs/product/assets/ui-v2/auth-forgot-desktop.png`

---

## Remaining Product Debt

- Demos (`/app/portfolio`) coherence  
- Final polish pass across authenticated surfaces  
- Invite / role management (product-grill only)  
- Forbidden page optional consistency (out of F12 auth-entry scope)

---

## Remaining Technical Debt

- F10: Fila full retrieve; Prioridades candidate set; parallel E2E under load  
- Local Neon hygiene (human)  
- Playwright webServer prefers `pnpm` when no reuse (environment PATH)  
- RSC must import Chakra `Card` directly (not `@/components/ui/card` client compound object)

---

## Recommended F13

1. **Demos** (`/app/portfolio`) Product UI coherence — remove marketing cover gradients / naming clarity.  
2. Optional forbidden/empty polish only if still in Product UI V2.  
3. Do **not** start invite/role or final mega-polish until Demos done.

---

## Environment declaration

- Ambiente: local Docker `:5433` + existing `next dev` (F8 QA script)  
- Mutações: E2E login / password-reset / must-change only against local DB  
- Migrations: nenhuma  
- Produção: **não modificada**

---

**F12 COMPLETE — NO F13 WORK STARTED. NO COMMIT. NO PUSH.**
