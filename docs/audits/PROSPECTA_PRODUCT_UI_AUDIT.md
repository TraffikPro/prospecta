# Prospecta — Product UI Audit (Phase 0)

**Status:** READ-ONLY AUDIT COMPLETE  
**Date:** 2026-09-29  
**Scope:** Presentation / UX layer of the authenticated product and public auth surfaces  
**Constraint:** No production code changed; only this report was created.

---

## 1. Executive Summary

O Prospecta **já se comporta, em larga medida, como software B2B operacional** — não como landing SaaS genérica. A stack é Next.js 16 + Chakra UI v3 + tokens teal/slate; há shell com sidebar/grupos, filas priorizadas, KPIs de carteira semanal, playbook comercial no lead detail, e empty states orientados a próxima ação.

Os problemas principais **não** são glow/purple/Framer Motion (quase inexistentes no app autenticado). São:

1. **Colisão semântica de “Portfólio”** (sites-conceito vs carteira semanal / `WeeklyPortfolio`).
2. **Fragmentação operacional de leads** em quatro superfícies (Minha fila, Inteligência, Pipeline, Leads) com densidade e poder de ação desiguais.
3. **Listas operacionais card-first** onde tabelas densas seriam mais rápidas (fila, pipeline, equipe, jobs).
4. **Superfície de leads “base” fraca** (`/app/leads`: poucas colunas, sem busca/filtro/paginação; empty state com `Text` **sem import**).
5. **Auth marketing shell** (gradient + blur + copy “Transforme…”) — isolado, mas é o principal sinal “cara de IA/template”.
6. **Navegação de Aquisição** visível para `MEMBER` com `canRunAcquisition`, enquanto a página/action exigem `ADMIN` (`prisma/schema.prisma` + `admin/acquisition/page.tsx`).

**Veredito:** a base de domínio e a direção visual autenticada são boas. O redesign v2 deve ser **refino workflow-first / density / naming**, não reescrita estética.

---

## 2. Repository State

| Item | Valor |
|------|--------|
| Branch | `docs/prospecta-ecosystem-engineering-case` |
| Tracking | up to date with `origin/docs/prospecta-ecosystem-engineering-case` |
| Working tree | clean de staged/modified; **untracked:** `docs/product/assets/social-preview/` |
| Últimos commits | `0f44b53` docs(prospecta): consolidate ecosystem engineering case · `8d98752` Merge PR #75 CI security · `dac82de` fix(security) CodeQL · `8cab3e1` docs engineering case · `38ee379` docs ingestion evidence |

**Git commands run (read-only):** `git status`, `git branch --show-current`, `git log -5 --oneline`.  
**No commit / checkout / reset.**

---

## 3. Current Stack

| Layer | Evidence |
|-------|----------|
| App | Next.js **16.3.3** App Router (`package.json`, `src/app/**`) |
| UI | React **19.2.4**, Chakra UI **^3.36.1**, Emotion |
| Theming | `src/theme/index.ts` + `src/theme/text-styles.ts`; brand teal; semantic success/warning/danger |
| Tailwind | **Ausente** do produto (removido; ADR 0011) |
| Icons | SVGs inline em `src/components/navigation/nav-icons.tsx` — **sem Lucide** |
| Motion | **Sem Framer Motion**; transitions CSS limitadas (sidebar width, hover de card) |
| Charts | **Nenhum** chart library; progresso via `Progress` em `progress-metric.tsx` |
| Data | Prisma 6 + PostgreSQL; domínio em `prisma/schema.prisma` |
| Auth | Session cookie-based; roles `ADMIN` \| `MEMBER` |
| Forms | Server Actions + `useActionState` |
| Toasts | `src/components/ui/toaster.tsx` |

**Design system existente (parcial):**

- Tokens: `brand.*`, `radii.card` (12px), `radii.button` (6px), spacing `sm/md/lg/touch`, containers form/detail/list.
- Text styles: `pageTitle`, `sectionTitle`, `meta`.
- Wrappers: `Button`, `Input`, `AppCard` (exportado, **não usado**), `AppEmptyState`, `PageFrame`, `PageHeading`, `PageSkeleton`.

---

## 4. Product Domain Map

Nomes **reais** no código/schema:

| Conceito | Onde aparece | Função | Relações | Ações do usuário | Dados típicos |
|----------|--------------|--------|----------|------------------|---------------|
| **Lead** | `Lead` model; filas, pipeline, detail, tables | Unidade comercial (empresa + contato) | Owner `User`; `Activity[]`; `LeadAssignment[]`; `intelligence` JSON | Criar, abrir, contatar, registrar atividade, mover stage, reassign (ADMIN) | companyName, stage, source, phone/email, score |
| **LeadStage** | NEW→…→WON/LOST | Pipeline comercial | Atualizado via `MoveStageForm` + activity STAGE_CHANGE | Mudar etapa + motivos | stage, lostReason, wonNote |
| **Activity** | Timeline + create form | Verdade do contato (clique ≠ contato) | lead, author, type, outcome | Registrar WhatsApp/e-mail/nota | type, outcome, body, createdAt |
| **Intelligence** | `Lead.intelligence` JSON; inbox `/app/intelligence`; cards no detail | Qualificação Places (score, HIGH/MEDIUM/LOW, signals, pitch, diagnostic) | Gerada fora (generator/runner); parse em `parse-intelligence` | Filtrar, abrir lead, usar pitch/playbook | score, qualification, signals, rating/reviews |
| **WeeklyPortfolio / Carteira** | `WeeklyPortfolio`, banner em my-leads, KPIs dashboard | Meta semanal HIGH + assignments | `LeadAssignment`, `OperatorWeeklyQuota` | Completar carteira (`FillWalletButton`), tratar leads | target, assigned, treated, pending, slots |
| **LeadAssignment** | Portfolio services / high-pool | Ciclo de atribuição HIGH | assignee, status ACTIVE/TREATED/RELEASED | Reciclar (ADMIN), tratar via activity | source, dueAt, treatedAt |
| **AcquisitionJob** | `/admin/acquisition`, wallet fill | Pull Places via runner | FREE_PULL (ADMIN UI) vs WALLET_FILL (operador) | Solicitar pull; completar carteira | city, query, status, counts |
| **Portfólio comercial** | `/app/portfolio` + `PORTFOLIO_CATALOG` | **Sites-conceito** para demo na conversa | Estático; não é `WeeklyPortfolio` | Filtrar nicho, abrir demo, copiar link | title, niche, previewUrl |
| **CommercialPlaybook** | Lead detail | Scripts D0+ e respostas | Depende de intelligence/sinais | Copiar mensagem, abrir WhatsApp (sem registrar) | steps, replies, reasons |
| **User / Session** | Auth + Equipe | Operador ADMIN/MEMBER | ownership, quotas, canRunAcquisition | Login, logout, change password, admin toggles | role, quota, isActive |
| **AdminAuditEvent** | Backend | Trilha mínima ADMIN | Não exposto como UI de audit trail | — | action, actorId |

**Ambiguidade crítica:** na UI, “Portfólio” = demos comerciais; no domínio de carteira, “portfolio” = `WeeklyPortfolio` / meta semanal. Isso conflita com o modelo mental do operador.

---

## 5. Primary User Workflows

Fluxos **implementados** (não hipotéticos):

### A. Operação diária do MEMBER

1. Login → redirect pós-auth (`postAuthPath`).
2. **Visão geral** (`/app`) — KPIs da semana + CTA “Tratar pendências”.
3. **Minha fila** (`/app/my-leads`) — banner carteira → summary cards → filtros → lista priorizada → Abrir lead / Registrar contato.
4. **Lead detail** — próxima ação → contato WhatsApp/e-mail → playbook/inteligência → registrar atividade → histórico → mover stage.
5. Opcional: **Completar carteira** (WALLET_FILL) quando elegível.

### B. Priorização por score

1. **Inteligência** (`/app/intelligence`) — filtro HIGH/MEDIUM/LOW + source → `LeadScoreCard` → detail.

### C. Visão por etapa

1. **Pipeline** (`/app/pipeline`) — accordion por stage → cards → paginação “Ver todos”.

### D. Base / cadastro manual

1. **Leads** (`/app/leads`) → tabela mínima → **Novo Lead** (`/app/leads/new`).

### E. Apoio comercial na conversa

1. **Portfólio** (`/app/portfolio`) — escolher demo por nicho → copiar/abrir.

### F. Gestão ADMIN

1. **Equipe** — quota + `canRunAcquisition`.
2. **Revisão HIGH** — pool / recycle.
3. **Aquisição** — FREE_PULL Places (ADMIN only).

---

## 6. Route Inventory

| Rota | Tela | Objetivo real | Entidade principal | Ação principal | Estado |
|------|------|---------------|--------------------|----------------|--------|
| `/` | Redirect | Auth gate | Session | Redirect login/app | UTILITY |
| `/login` | Login | Entrar | Session | Autenticar | CORE |
| `/forgot-password` | Recuperação | Reset | Token | Solicitar e-mail | UTILITY |
| `/reset-password` | Nova senha | Reset | Token | Definir senha | UTILITY |
| `/change-password` | Troca obrigatória | Compliance | User | Trocar senha | UTILITY |
| `/app` | Visão geral | Meta/carteira da semana | Weekly KPIs | Ir para fila / gestão | CORE |
| `/app/my-leads` | Minha operação / fila | Trabalhar próximos leads | Lead (owned queue) | Abrir / registrar contato | CORE |
| `/app/intelligence` | Oportunidades prioritárias | Priorizar por score | Lead + intelligence | Abrir lead HIGH | CORE |
| `/app/pipeline` | Pipeline | Ver/navegar por stage | LeadStage | Abrir lead na etapa | CORE |
| `/app/leads` | Lista de leads | Base / inventário | Lead | Abrir / criar | SECONDARY |
| `/app/leads/new` | Cadastro | Criar lead manual | Lead | Submit form | SECONDARY |
| `/app/leads/[id]` | Lead detail | Executar contato + registrar | Lead | Contatar + activity + stage | CORE |
| `/app/portfolio` | Portfólio comercial | Demos para pitch | PortfolioModel (static) | Abrir/copiar demo | SECONDARY |
| `/app/more` | Mais (mobile) | Overflow nav + logout | Nav | Navegar / sair | UTILITY |
| `/admin/acquisition` | Aquisição | FREE_PULL ADMIN | AcquisitionJob | Disparar job | SECONDARY |
| `/admin/high-pool` | Revisão HIGH | Gestão do pool | LeadAssignment | Reciclar / revisar | SECONDARY |
| `/admin/users` | Equipe | Operadores + meta | User / Quota | Autorizar / set quota | SECONDARY |

**Duplicações / consolidação (evidência, sem remoção proposta):**

- **Minha fila × Inteligência × Pipeline × Leads** — quatro listas do mesmo `Lead` com jobs diferentes; consolidação prematura quebraria workflows, mas a navegação precisa esclarecer “quando usar cada uma”.
- **Portfólio nav × Carteira semanal** — nomes colidem; não são a mesma entidade.
- **Aquisição nav vs gate ADMIN** — item de nav para MEMBER autorizado aponta para página que dá `forbidden`.

---

## 7. App Shell Audit

**Evidência:** `src/components/layout/app-shell.tsx`, `app-sidebar.tsx`, `nav-config.ts`.

### Estrutura

- Desktop: sidebar sticky (expand/collapse), grupos Operação / Base comercial / Gestão.
- Mobile: top bar “Prospecta + user”; bottom nav Fila / Inteligência / Pipeline / Mais; `pb="20"` no conteúdo.
- Conteúdo: `Container maxW="containerList"` **mais** `PageFrame` (possível **padding/max-width duplo**).
- Breadcrumbs: `ContextualNav` (desktop trail; mobile back).
- Sem workspace/tenant switcher (single-tenant implícito — N/A).
- Profile menu: Avatar + Sair.

### Navegação — modelo mental vs estrutura técnica

A nav mistura **trabalho diário** (fila, inteligência, pipeline) com **artefatos comerciais** (leads, portfólio demos) e **gestão**. Isso é defensável, mas o rótulo “Portfólio” e o item “Aquisição” para MEMBER não batem com o domínio.

| Item | Decisão | Motivo |
|------|---------|--------|
| Visão geral | KEEP | KPIs de carteira com CTA operacional |
| Minha fila | KEEP | Primary daily work |
| Inteligência | CHANGE (label/help) | Nome soa “AI product”; é inbox de score Places |
| Pipeline | KEEP | Stage navigation |
| Leads | CHANGE | Base fraca; precisa papel claro vs fila |
| Portfólio | CHANGE (rename) | Colide com carteira/WeeklyPortfolio |
| Aquisição | QUESTION | Nav MEMBER vs page ADMIN-only |
| Revisão HIGH | KEEP (ADMIN) | Domínio real |
| Equipe | KEEP (ADMIN) | Domínio real |
| Mais | KEEP | Mobile overflow |

---

## 8. Screen-by-Screen Audit

### `/app` — Visão geral

**Purpose:** Entender meta/carteira da semana e ir para ação.  
**Primary entity:** Weekly KPIs (`DashboardKpiSnapshot`).  
**Primary action:** CTA → `/app/my-leads` (MEMBER) ou Equipe/HIGH (ADMIN).  
**Secondary:** Ver progresso %, origem da carteira.  
**Current structure:** Heading → week label → KPI grid 4 → painéis Progresso/Origem → CTAs.  
**Strengths:** KPIs ligados a meta real; empty states tipados; pending enfatizado.  
**Problems:** Grid 4 KPI cards clássicos; painéis “card” adicionais; pouco atalho contextual por lead.  
**AI-template signals:** Baixos (sem gradient); padrão “dashboard SaaS” leve via 4 cards.  
**Operational friction:** MEMBER ainda precisa um clique para a fila.  
**Hierarchy:** Pendentes bem destacados (`emphasized`).  
**Density:** GOOD.  
**Recommendation:** CHANGE (tornar KPIs mais row/toolbar + deep-links).  
**Severity:** P2.

### `/app/my-leads` — Minha operação

**Purpose:** Atacar atrasados / follow-ups / sem contato.  
**Primary entity:** Lead (owned queue).  
**Primary action:** Abrir lead / Registrar contato.  
**Secondary:** Completar carteira; filtrar buckets.  
**Current structure:** Banner carteira → 3 summary cards → chip filters → card list por seção.  
**Strengths:** Priorização real; empty states por filtro; highlight overdue/due; CTAs na row.  
**Problems:** Summary cards **duplicam** filtros; lista **card-heavy** (gap 8, font lg); baixo throughput visual.  
**AI-template signals:** KPI-like summary cards.  
**Operational friction:** Densidade LOW–GOOD; muitos cliques para scan rápido.  
**Hierarchy:** Boa (atrasados primeiro).  
**Density:** LOW/GOOD.  
**Recommendation:** CHANGE (lista/tabela densa; summary → inline counts).  
**Severity:** P0 (densidade da tela mais usada).

### `/app/intelligence` — Oportunidades prioritárias

**Purpose:** Priorizar por score/qualification.  
**Primary entity:** Lead + intelligence.  
**Primary action:** Abrir lead.  
**Secondary:** Filtros qualification/source.  
**Current structure:** Counts line → filters → stack de `LeadScoreCard`.  
**Strengths:** Score grande = decisão; signals/pitch preview; empty + limpar filtros.  
**Problems:** Card list; score 2xl pode competir com nome da empresa; sem bulk.  
**AI-template signals:** Label “Inteligência”; score hero.  
**Operational friction:** Sem ação inline (só abrir).  
**Hierarchy:** Score antes do nome — questionável para operação.  
**Density:** GOOD.  
**Recommendation:** CHANGE (label + row denser).  
**Severity:** P1.

### `/app/pipeline`

**Purpose:** Navegar leads por stage.  
**Primary entity:** LeadStage.  
**Primary action:** Abrir lead na etapa.  
**Secondary:** Paginar stage selecionado.  
**Current structure:** Accordion desktop+mobile quase idênticos; grid de `LeadStageCard`.  
**Strengths:** Counts; pagination; empty por coluna; link “Ver lista”.  
**Problems:** Dois boards quase duplicados (`pipeline-desktop` / `pipeline-mobile`); cards em grid 3 colunas = Kanban-lite sem drag; baixa densidade vs tabela.  
**AI-template signals:** Card grid.  
**Operational friction:** Não move stage no board (só no detail).  
**Hierarchy:** Stage badge claro.  
**Density:** LOW/GOOD.  
**Recommendation:** CHANGE (uma implementação; rows densas opcionais).  
**Severity:** P1.

### `/app/leads`

**Purpose:** Inventário / criar manual.  
**Primary entity:** Lead.  
**Primary action:** Abrir / + Novo Lead.  
**Secondary:** —  
**Current structure:** Heading + button → `LeadTable` (3 cols) ou empty.  
**Strengths:** Tabela outline (padrão B2B).  
**Problems:** Sem owner, follow-up, score, busca, sort, paginação; empty usa `<Text>` **não importado** (`leads/page.tsx` importa só `Box`) — empty state provavelmente quebra em runtime.  
**AI-template signals:** Nenhum.  
**Operational friction:** Alta se a base crescer.  
**Hierarchy:** Fraca.  
**Density:** LOW (poucos dados).  
**Recommendation:** CHANGE (ou MERGE papel com fila).  
**Severity:** P0 (bug empty + capacidade).

### `/app/leads/[id]` — Lead detail

**Purpose:** Contatar, registrar resultado, avançar.  
**Primary entity:** Lead.  
**Primary action:** Contatar + Registrar atividade.  
**Secondary:** Playbook, intelligence, stage, reassign ADMIN, origin notes.  
**Current structure:** `LeadInfoCard` header → `LeadDetailLayout` 65/35 (Fatia A) com rail sticky.  
**Strengths:** Workflow-first rail; disclaimer playbook (copiar ≠ contato); a11y sections; density intentional.  
**Problems:** Vários cards empilhados (info + playbook + intelligence + activity + stage); volume cognitivo alto.  
**AI-template signals:** Baixos; “Inteligência do lead” wording.  
**Operational friction:** Scroll longo no mobile; bom sticky no desktop.  
**Hierarchy:** Próxima ação em destaque — forte.  
**Density:** HIGH (desejável).  
**Recommendation:** KEEP / REFINE (reduzir card nesting).  
**Severity:** P2.

### `/app/portfolio`

**Purpose:** Escolher site-conceito para enviar na conversa.  
**Primary entity:** PortfolioModel (catálogo estático).  
**Primary action:** Abrir demo / copiar link.  
**Secondary:** Filtro nicho.  
**Current structure:** Disclaimer → filters → grid 3 colunas de cards com cover gradient.  
**Strengths:** Disclaimer anti-case; copy link.  
**Problems:** Naming; cover gradients; grid marketing; disclaimer repetido no card.  
**AI-template signals:** Cover gradients (`portfolio-cover.tsx`).  
**Operational friction:** OK para uso ocasional.  
**Density:** LOW (OK para catálogo).  
**Recommendation:** CHANGE (rename + densificar).  
**Severity:** P1 (naming), P3 (visual).

### `/admin/acquisition`

**Purpose:** FREE_PULL Places ADMIN.  
**Primary entity:** AcquisitionJob.  
**Primary action:** Solicitar job.  
**Secondary:** Ver histórico.  
**Strengths:** Copy operacional explícita (runner externo).  
**Problems:** Jobs como cards no mobile table pattern; nav MEMBER mismatch.  
**Recommendation:** KEEP + fix nav visibility.  
**Severity:** P1 (nav), P2 (table).

### `/admin/high-pool` / `/admin/users`

**Purpose:** Gestão HIGH / operadores.  
**Strengths:** Domínio real; quotas; badges.  
**Problems:** Users como **card grid** (`users-table.tsx` nome vs UI cards) — baixa densidade admin.  
**Recommendation:** CHANGE → tabela real.  
**Severity:** P1.

### Auth (`/login` etc.)

**Purpose:** Entrar / recuperar.  
**AI-template signals:** **Fortes** em `auth-brand-panel.tsx` / `public-auth-brand-panel.tsx`: `bgGradient`, radial dots, `blur(80px)`, headline “Transforme oportunidades…”, hero 4xl.  
**Recommendation:** CHANGE (painel institucional operacional).  
**Severity:** P2 (fora do workflow diário).

### `/app/more`

**Purpose:** Overflow mobile.  
**Recommendation:** KEEP.  
**Severity:** P3.

---

## 9. Component Audit

| Componente | Onde usado | Função | Problema | Decisão |
|------------|------------|--------|----------|---------|
| `AppShell` | authenticated layout | Shell | Container + PageFrame overlap | REFINE |
| `AppSidebar` | desktop | Nav | OK | KEEP |
| `PageFrame` | pages | Width tokens | Gap default 6 amplo em listas | KEEP |
| `PageHeading` / `SectionHeading` | pages | Hierarchy | Consistente | KEEP |
| `ContextualNav` | pages | Breadcrumb/back | OK | KEEP |
| `AppEmptyState` | várias | Empty operacional | Bom | KEEP |
| `PageSkeleton` | 5 loadings | Loading | Falta em `/app`, `/leads`, admin | REFINE |
| `Button` / `Input` | UI | Primitives | Defaults brand/radius bons | KEEP |
| `AppCard` | **não usado** | Wrapper | Dead export | DEPRECATE ou adotar |
| `Card.Root` (Chakra) | muitos | Superfície | Uso indiscriminado | REFINE |
| `KpiStatCard` | dashboard | KPI | Genérico mas actionable | REFINE |
| `MyQueueSummaryCards` | my-leads | Counts | Duplica filtros | MERGE into filters |
| `MyQueueList` cards | my-leads | Queue rows | Baixa densidade | CHANGE |
| `LeadTable` | leads | Table | Pobre | REFINE |
| `LeadScoreCard` | intelligence | Inbox row | Card + score hero | REFINE |
| `LeadStageCard` | pipeline | Stage item | Card grid | REFINE |
| `LeadInfoCard` | detail | Header | Card OK | KEEP |
| `LeadNextActionCard` | detail | Next action | Card OK | KEEP |
| `IntelligenceCard` | detail | Score/signals | Nested surfaces | REFINE |
| `CommercialPlaybookSection` | detail | Scripts | Card grande | KEEP |
| `WeeklyPortfolioBanner` | my-leads | Carteira | Naming vs Portfólio | REFINE copy |
| `PortfolioCard` | portfolio | Demo | Marketing cover | REFINE |
| `UsersTable` | admin | Users | Cards, não table | CHANGE |
| `AcquisitionJobsTable` | admin | Jobs | Cards no narrow | REFINE |
| `PipelineBoard` | pipeline | Stages | Dup desktop/mobile | MERGE |
| `NavIcon` | sidebar | Icons | FUNCTIONAL | KEEP |
| Auth brand panels | login/public | Brand | Gradient/blur/marketing | CHANGE |

---

## 10. Card Audit

**Pergunta aplicada:** a superfície representa entidade/agrupamento que precisa de painel próprio?

| Uso | Merece card? | Notas |
|-----|--------------|-------|
| Lead detail next action / info / playbook / intelligence / forms | SIM (painéis) | Entidades/tarefas distintas |
| My-queue lead row | NÃO | Preferir row/list |
| Intelligence inbox item | FRACO | Row + score column |
| Pipeline lead | FRACO | Row dentro do stage |
| KPI dashboard | LIMÍTROFE | Preferir metric row se clicável |
| My-queue summary | NÃO | Inline filter counts |
| Portfolio demo | SIM | Item de catálogo |
| Admin user | NÃO | Table row |
| Acquisition job | NÃO (desktop) | Table |
| Dashboard progress/origem panels | LIMÍTROFE | Section + border suficiente |

**Card inside card (ocorrências / risco):**

- Lead detail: `LeadInfoCard` + nested `IntelligenceCard` / `PitchBox` (border) + playbook cards — **stack de cards**, não literalmente nested Root, mas percepção de “cards dentro de cards”.
- `IntelligenceCard` → `PitchBox` com `borderRadius="card"` e border própria — **superfície dentro de superfície** (`pitch-box.tsx` dentro de `intelligence-card.tsx`).
- `CommercialPlaybookSection` — chips bordered dentro de Card.
- My-queue: Card.Root wrapping link + buttons (aceitável, não nested).

**Sem `boxShadow` no app** — alinhado a border > shadow (positivo).

---

## 11. Dashboard / KPI Audit

Fonte: `dashboard.view.ts` + `getOperationalDashboard`.

| Métrica | Mede | Útil para | Decisão | Classificação |
|---------|------|-----------|---------|---------------|
| Meta / target | Quota semanal | Operador/gestão | Saber teto | CONTEXTUAL |
| Atribuídos | Assigned na semana | Ambos | Fill da carteira | ACTIONABLE (se deep-link) |
| Tratados | Treated | Ambos | Progresso | CONTEXTUAL |
| Pendentes | Pending | Operador | Exigem ação | **ACTIONABLE** |
| % carteira preenchida | fill rate | Ambos | Completar carteira | ACTIONABLE |
| % tratamento | treated/assigned | Ambos | Ritmo | CONTEXTUAL |
| Tratados vs meta | treated/target | Ambos | Cobertura da meta | CONTEXTUAL |
| Origem (nova/reciclados/…) | bySource counts | Gestão | Mix | CONTEXTUAL |
| Expiraram sem tratamento | weekClosed | Ambos | Perda operacional | ACTIONABLE (alerta) |
| Operadores com meta | team only | ADMIN | Cobertura de quota | CONTEXTUAL |

**Não há vanity charts.** KPIs são de carteira semanal — bons. Falta: KPI → filtro/deep-link (exceto CTA primary).

---

## 12. Copy Audit

| CURRENT COPY | PROBLEM | DIRECTION |
|--------------|---------|-----------|
| “Transforme oportunidades em próximas ações.” (`auth-brand-panel.tsx`) | Marketing genérico | “Leads, contatos e follow-ups no mesmo fluxo.” / números de produto |
| “Bem-vindo de volta” (`login`) | Neutro SaaS | Aceitável; opcional “Entrar no Prospecta” |
| “Inteligência” (nav) | Soa AI platform | “Prioridades” / “Fila por score” |
| “Oportunidades prioritárias” | OK-ish | Manter ou “Leads por score” |
| “Qualificação gerada para apoiar a abordagem comercial” | Vago | “Score e sinais do Places para esta empresa” |
| “Portfólio comercial” | Colide com carteira | “Demos” / “Sites-conceito” / “Material de apoio” |
| “Minha operação” vs nav “Minha fila” | Inconsistência título/nav | Unificar label |
| “Acompanhe a meta, a carteira…” (dashboard) | Soft | Manter; reforçar números |
| “Tratar pendências” | Operacional — bom | KEEP |
| “Completar carteira” / “Tratado = WhatsApp…” | Operacional — bom | KEEP |
| “Copiar ou abrir o WhatsApp não registra o contato.” | Excelente regra de domínio | KEEP |
| PORTFOLIO_DISCLAIMER | Excelente anti-vanity | KEEP |

Pouca copy “Revolucione/AI-powered”; o problema está concentrado no login brand + naming Inteligência/Portfólio.

---

## 13. Icon Audit

| Local | Classificação | Notas |
|-------|---------------|-------|
| `NavIcon` sidebar | FUNCTIONAL | Identifica destinos; `aria-hidden` |
| Collapse / profile | FUNCTIONAL | Controles |
| Mobile bottom nav | — | **Só texto**, sem ícones (bom para clareza; menos “app template”) |
| Badges (stage/source/qualification/role) | SUPPORTIVE | Status, não decoração |
| Auth `ProspectaMark` | SUPPORTIVE | Brand |
| Pipeline graphic no login | DECORATIVE | Ilustração marketing |
| Icon-in-gradient-box | **Ausente** no app autenticado | Positivo |
| Lucide space-fillers | **Ausente** | Positivo |

---

## 14. Motion Audit

| Item | Classificação |
|------|---------------|
| Sidebar `transition width 0.15s` | STATE TRANSITION |
| My-queue card `transition background/border` | FEEDBACK (hover/active) |
| Skeleton pulse (Chakra default) | FEEDBACK / loading |
| Framer Motion | **Ausente** |
| Animated gradients | **Ausente** no app; blur estático no login | DECORATIVE (login) |
| Entrance animations | **Ausente** |

**Conclusão:** motion no produto autenticado é saudável e mínimo.

---

## 15. Visual Token Audit

### Definidos (`src/theme/index.ts`)

- **Colors:** brand/success/warning/danger scales 50–950 + semantic solid/fg/muted/subtle…
- **Radii tokens:** `card` = 0.75rem (12px); `button` = 0.375rem (6px)
- **Spacing tokens:** sm 8px, md 16px, lg 24px, touch 44px
- **Sizes:** containers 720/960/1200; sidebar 15rem/4rem
- **Text styles:** 1.5rem / 1.125rem / 0.875rem

### Uso real observado (além dos tokens)

- `borderRadius`: `card` | `button` | `md` | `full` (login blob) — **~4 famílias**
- `fontSize` ad-hoc: `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, + `size` props Heading — **≥9 valores**
- Shadows: **0 usos** de `boxShadow`/`shadow=` no TSX — sistema border-first de fato
- Gaps comuns: `1`, `2`, `3`, `4`, `6`, `8` — razoável, mas `gap="8"` em my-queue lista é generoso
- Gradients: login panels + `portfolio-cover.tsx` (teal/slate/amber hardcoded hex)

**Veredito:** há **sistema parcial**; tipografia e radius ainda acumulam valores Chakra default fora dos textStyles.

---

## 16. Data Density Audit

| Tela | Densidade | Comentário |
|------|-----------|------------|
| My-leads | LOW/GOOD | Cards grandes, gap 8, título lg |
| Intelligence | GOOD | Cards mas conteúdo útil |
| Pipeline | LOW/GOOD | Grid cards; accordion overhead |
| Leads table | LOW (dados) | Poucas colunas — “vazio de informação” |
| Lead detail | HIGH | Adequado a trabalho profundo |
| Dashboard | GOOD | Não vazio; não overcrowded |
| Portfolio | LOW | Catálogo — OK |
| Admin users | LOW | Cards em vez de tabela |

**Princípio:** “clean” ≠ empty. Filas operacionais devem subir densidade **sem** perder estados de urgência (cores overdue).

---

## 17. Table Audit

| Tabela | Colunas | Sort | Filter | Search | Pagination | Selection | Bulk | Row actions | Status | Responsive | Loading | Empty | Error |
|--------|---------|------|--------|--------|------------|-----------|------|-------------|--------|------------|---------|-------|-------|
| `LeadTable` | Empresa, Stage, Origem | N | N | N | N | N | N | Link only | badges | Table sm | Route partial | Broken import | N |
| `AcquisitionJobsTable` | fields via cards/table | N | N | N | recent only | N | N | N | status text | Card fallback | N | Yes | status text |
| `UsersTable` | **Cards**, não table | N | N | N | N | N | N | Inline forms | role/status | Grid | N | ? | alerts |
| Pipeline | N/A cards | Stage select | Stage | N | Yes (stage) | N | N | Abrir | stage badge | Accordion | skeleton | Yes | N |
| My-queue | N/A cards | Fixed priority | URL filter | N | N | N | N | Abrir/Registrar | priority badge | Stack | skeleton | Yes | N |

**Pergunta “ajuda a decidir e agir?”**

- My-queue / intelligence: **sim** (prioridade), mas com fricção de densidade.
- Leads table: **fraco**.
- Admin users: **age** (forms), mas scan ruim.

---

## 18. State Audit

| Tela | DEFAULT | LOADING | EMPTY | ERROR | NO RESULTS | NO PERMISSION | SUCCESS |
|------|---------|---------|-------|-------|------------|---------------|---------|
| `/app` | EXIST | MISSING route skeleton | EXIST | EXIST (`DashboardLoadError`) | — | via layout | — |
| my-leads | EXIST | EXIST | EXIST (filter-aware) | UNKNOWN | EXIST | layout | fill status |
| intelligence | EXIST | EXIST | EXIST | UNKNOWN | EXIST | layout | — |
| pipeline | EXIST | EXIST | EXIST | UNKNOWN | stage empty | layout | — |
| leads | EXIST | MISSING | **BROKEN?** (`Text` no import) | UNKNOWN | same | layout | — |
| lead detail | EXIST | EXIST | contact empty, intel fallback | forbidden/notFound | — | MEMBER ownership | form alerts |
| portfolio | EXIST | EXIST | EXIST | UNKNOWN | EXIST | layout | copy feedback |
| acquisition | EXIST | MISSING | EXIST | form alert | — | forbidden | — |
| high-pool | EXIST | MISSING | ? | UNKNOWN | — | forbidden | — |
| users | EXIST | MISSING | ? | form alerts | — | forbidden | — |
| login | EXIST | — | — | form alert | — | — | session expired status |

**Falta sistêmica:** `error.tsx` / `not-found.tsx` sob `src/app` (só `forbidden.tsx` encontrado). Estados de erro de rota = **MISSING/PARTIAL**.

---

## 19. Responsive Audit

| Área | Achado | Severidade |
|------|--------|------------|
| Sidebar → bottom nav | Bem pensado; Mais overflow | — |
| Touch targets | `minH="touch"` / `11` frequente | Positivo |
| Safe-area insets | top/bottom no shell | Positivo |
| Pipeline dual accordion | Duplicação; mobile sem border card nos items | P2 |
| Tables | Leads table sem strategy mobile dedicada | P2 |
| Filters my-leads | horizontal scroll touch | Positivo |
| Lead detail grid | ordem operacional mobile explícita | Positivo |
| Portfolio grid | 1/2/3 cols | OK |
| Admin users cards | OK no mobile; fraco no desktop | P1 |
| Overflow-x hidden no shell | Evita scroll horizontal | OK; pode mascarar bugs |

---

## 20. Accessibility Audit (estática / código)

**Existente (bom):**

- `SkipNavLink` / `SkipNavContent`
- `aria-label` em navs, collapse, profile, filtros
- `aria-current="page"`
- `aria-busy` / `VisuallyHidden` no skeleton
- `role="alert"` / `role="status"` em forms e banners
- Sections com `aria-labelledby` no lead detail
- Icon SVGs `aria-hidden`
- Password visibility toggle labeled

**Riscos / gaps:**

- Score/nome em intelligence: card inteiro é link — OK; mas hierarquia visual score-first
- Contraste: não medido (sem Lighthouse); brand teal em borders emphasized provavelmente OK
- Focus ring hardcoded `blue.500` no main (`app-shell.tsx`) vs brand focusRing token — inconsistência
- Tables sem caption/`scope` explícito além do Header
- Dialogs/modals: poucos; menus usam Chakra Menu
- Icon-only buttons: collapse/sidebar — têm aria-label
- Lead empty `Text` quebrado — a11y irrelevante se crashar

---

## 21. Product Maturity Signals

| Sinal | Status |
|-------|--------|
| Filtros URL (fila, intelligence, pipeline, portfolio) | EXISTING |
| Filtros persistentes cross-session | MISSING |
| Sorting user-controlled | PARTIAL (server fixed sorts) |
| Pagination | PARTIAL (pipeline only) |
| Bulk actions | MISSING |
| Activity history | EXISTING |
| Timestamps | EXISTING |
| Audit trail UI | MISSING (backend `AdminAuditEvent` only) |
| Ownership | EXISTING |
| Permissions / roles | EXISTING |
| Confirmation destructive | PARTIAL (recycle/forms; pouco confirm modal) |
| Undo | MISSING |
| Retry | PARTIAL (rate limit / form resubmit) |
| Error recovery | PARTIAL |
| Loading skeletons | PARTIAL |
| Empty states | EXISTING (strong) |
| Destructive protection | PARTIAL |
| Search | MISSING (leads/fila) |
| Keyboard nav | PARTIAL (native + skip) |
| Saved views | MISSING |
| Status transitions | EXISTING (stages + assignment) |
| “Clique ≠ contato” rule UX | EXISTING (excelente) |

---

## 22. AI Feature Integration Audit

Não há produto “Prospecta AI” genérico no app.

O que existe é **`Lead.intelligence` JSON** (score, qualification, signals, diagnostic, pitch, Places evidence) produzido pelo ecossistema de aquisição/generator — exibido como:

- Inbox `/app/intelligence`
- Cards no lead detail
- Inputs do commercial playbook

**Direção correta:** tratar como **capability no workflow** (priorizar, explicar, sugerir mensagem) — já parcialmente feito.  
**Evitar:** rebrand “AI-powered”; o label “Inteligência” já puxa essa leitura. Preferir “Score / Sinais / Prioridades”.

---

## 23. Technical Debt Affecting UX

1. `AppCard` morto vs `Card.Root` espalhado.
2. `UsersTable` / `AcquisitionJobsTable` naming ≠ table UI.
3. `PipelineBoard` desktop/mobile duplicado.
4. `leads/page.tsx` — `Text` sem import.
5. Nav acquisition visibility ≠ ADMIN gate.
6. Naming Portfólio / WeeklyPortfolio / carteira.
7. Container shell + PageFrame double constraint.
8. Falta `error.tsx` / `not-found.tsx` de rota.
9. Loading skeletons incompletos.
10. Tipografia ad-hoc fora de `textStyles`.

---

## 24. KEEP / CHANGE / REMOVE Matrix

| Area | Current | Decision | Priority | Reason |
|------|---------|----------|----------|--------|
| Domain model Lead/Activity/Assignment | Solid | KEEP | — | Não tocar no domínio |
| Chakra v3 + teal tokens | Solid base | KEEP | — | Já anti-purple |
| App shell sidebar/mobile | Bom | REFINE | P2 | Double container; focus ring |
| PageHeading / PageFrame / EmptyState | Consistente | KEEP | — | Foundation boa |
| Auth brand panel | Gradient/blur/marketing | CHANGE | P2 | Único hotspot “AI template” |
| Nav label Inteligência | Ambíguo | CHANGE | P1 | Domain = score inbox |
| Nav label Portfólio | Colisão carteira | CHANGE | P0 | Confunde operador |
| Nav Aquisição MEMBER | Inconsistente | CHANGE | P1 | Evitar forbidden |
| Dashboard KPIs | Actionable | REFINE | P2 | Deep-links / menos card chrome |
| My-leads density | Card list | CHANGE | P0 | Tela diária |
| My-leads summary cards | Duplicam filtros | MERGE | P1 | Reduz chrome |
| Intelligence inbox | Cards + naming | CHANGE | P1 | Density + label |
| Pipeline board | Dup + cards | CHANGE | P1 | Merge + densificar |
| Leads table | Fraca + bug empty | CHANGE | P0 | Capacidade + fix |
| Lead detail Fatia A | Workflow-first | KEEP | — | Melhor tela |
| Lead detail card stack | Nested surfaces | REFINE | P2 | PitchBox nesting |
| Portfolio demos | Útil | CHANGE | P1 | Rename + cover |
| Admin users cards | Baixa densidade | CHANGE | P1 | Tabela real |
| AppCard unused | Dead | REMOVE/DEPRECATE | P3 | Ou padronizar |
| Framer/glow/charts vanity | Ausentes | KEEP absent | — | Não introduzir |
| Generative AI marketing | Ausente | KEEP absent | — | Capability only |

---

## 25. P0 / P1 / P2 / P3 Priorities

### P0
1. Densidade e scan da **Minha fila** (lista operacional).
2. **Rename/clarificação Portfólio vs Carteira**.
3. **Leads list**: corrigir empty (`Text` import) + colunas/filtros mínimos.

### P1
1. Renomear/explicar **Inteligência**.
2. Alinhar **nav Aquisição** ao gate ADMIN (ou expor fluxo MEMBER real).
3. Densificar **Pipeline** e unificar mobile/desktop.
4. **Equipe** como tabela.
5. Portfolio: rename + reduzir marketing cover.

### P2
1. Auth brand panel operacional.
2. Dashboard KPI → deep-links; menos chrome.
3. Lead detail: reduzir nesting de superfícies.
4. Shell: um único width constraint; focus ring brand.
5. `error.tsx` / skeletons faltantes.

### P3
1. Deprecar `AppCard` ou adotar.
2. Polish tipografia via textStyles.
3. Disclaimer duplicado no portfolio card.
4. Copy login “Bem-vindo de volta”.

---

## 26. Proposed Product UI v2 Principles

1. **Task → Data → Action → Feedback** em toda tela CORE.
2. **Uma cor de marca (teal)**; surfaces neutras; **borders > shadows**.
3. Radius moderado: manter ~6px controles / ~8–12px painéis (avaliar `card` 12px → 8px só se inconsistência visual exigir).
4. **Tipografia compacta** operacional; textStyles obrigatórios para títulos.
5. **Tables/lists fortes** nas filas; cards só para entidades/tarefas (detail panels, demos).
6. **Naming = domínio do operador**, não da arquitetura (`Demos`, `Fila por score`, `Carteira semanal`).
7. Motion só feedback/estado.
8. Empty/error/loading como cidadão de primeira classe.
9. Densidade controlada: mais linhas por viewport na operação diária.
10. IA/score como **dado no workflow**, nunca como hero de marketing.

---

## 27. Risks

| Risco | Detalhe |
|-------|---------|
| Rename Portfólio | Quebra e2e/tests/`data-testid` e hábitos; precisa alias/redirect |
| Densificar fila | Pode remover affordances touch se mal feito |
| Unificar listas | Over-merge quebra papéis distintos fila/score/stage |
| Auth redesign | e2e `login-visual.spec.ts` asserta copy atual |
| Nav acquisition | Fix de ACL vs expectativa de MEMBER autorizados |
| Escopo creep | Não migrar schema/jobs/auth “de passagem” |

---

## 28. Unknowns

1. Volume típico de leads por operador no piloto (impacta paginação da fila).
2. Se MEMBER `canRunAcquisition` deveria ver **alguma** UI de pull além de wallet fill.
3. Roadmap de multi-tenant/workspace (hoje N/A).
4. Preferência real dos operadores: kanban vs lista no pipeline.
5. Contraste WCAG real (não medido).
6. Conteúdo futuro do catálogo portfolio (mais nichos?).
7. Se `diagnostic`/`pitch` virão de LLM no futuro (hoje payload estruturado).

---

## 29. Recommended Implementation Sequence

Ordem determinada pela auditoria (não template genérico):

### F1 — Clarity & correctness (P0)
- **Objetivo:** Naming Portfólio/Carteira; fix `leads` empty; alinhar nav Aquisição.
- **Telas:** nav, portfolio, leads, acquisition visibility.
- **Deps:** copy + tests e2e.
- **Risco:** baixo–médio (strings/tests).
- **AC:** operador distingue demos vs carteira; `/app/leads` empty não quebra; MEMBER não vê Aquisição ADMIN-only (ou fluxo real documentado).

### F2 — Design tokens & primitives (P1 foundation)
- **Objetivo:** consolidar radius/type/spacing; adotar ou remover `AppCard`; section vs card guidance.
- **Componentes:** theme, Button/Input/Card policy, PageFrame/shell width.
- **Deps:** F1 naming independente.
- **Risco:** baixo (visual).
- **AC:** documentar token table; zero shadows novas; textStyles em headings.

### F3 — App shell nav IA labels (P1)
- **Objetivo:** labels/grupos alinhados ao workflow.
- **Telas:** sidebar, more, mobile.
- **AC:** “Fila por score” (ou similar) no lugar de Inteligência; demos renomeados.

### F4 — Minha fila density (P0 UX)
- **Objetivo:** lista densa com urgência preservada; summary merged into filters.
- **Componentes:** `MyQueueList`, `MyQueueSummaryCards`, filters.
- **Deps:** F2 tokens.
- **AC:** ≥2× leads above fold vs baseline em viewport 1440; CTAs touch ≥44px; empty states intactos.

### F5 — Lead detail refine (P2)
- **Objetivo:** reduzir nesting; manter Fatia A.
- **AC:** PitchBox sem “card no card”; rail sticky intacto.

### F6 — Intelligence + Pipeline densify (P1)
- **Objetivo:** rows; um PipelineBoard; score sem hero desnecessário.
- **AC:** filtros intactos; pagination pipeline intacta.

### F7 — Leads base table (P0/P1)
- **Objetivo:** colunas úteis + busca/filtro básico + paginação se volume exigir.
- **AC:** owner (ADMIN), stage, source, follow-up/score; empty/error OK.

### F8 — Admin surfaces (P1)
- **Objetivo:** Users + jobs como tabelas densas.
- **AC:** mesmas actions; melhor scan.

### F9 — States & a11y (P2)
- **Objetivo:** `error.tsx`/`not-found`; skeletons restantes; focus brand.
- **AC:** rotas CORE cobertas; skip-nav + alerts preservados.

### F10 — Auth surface (P2)
- **Objetivo:** painel brand operacional sem blur/marketing genérico.
- **AC:** e2e visual atualizado; login funcional.

### F11 — Polish (P3)
- Portfolio covers, copy residual, deprecate dead exports.

---

## Hypothesis — Future Design Tokens

Comparado ao sistema atual (`card` 12px, `button` 6px):

| Token | Hipótese v2 | Justificativa |
|-------|-------------|---------------|
| `radii.control` | 6px (manter button) | Controles compactos |
| `radii.panel` | 8px | Ligeiramente abaixo de 12px para listas densas; ou **manter 12px** se preferir estabilidade |
| `radii.card` | alias → panel | Evitar terceiro valor |
| Shadows | nenhum token de elevação default | border > shadow já é fato no código |
| `fontSize.data` | 0.8125–0.875rem | Densidade operacional |
| `fontSize.metric` | 1.25–1.5rem | KPI sem 2xl/3xl desnecessário em filas |
| Surface | `bg` + `border` | Manter |
| Brand | teal 600 solid | Manter |

**Não forçar mudança de radius sem side-by-side** — o sistema atual já é mais maduro que o típico template AI.

---

## Evidence Index (paths)

- Theme: `src/theme/index.ts`, `src/theme/text-styles.ts`
- Shell: `src/components/layout/app-shell.tsx`, `app-sidebar.tsx`, `page-frame.tsx`, `page-heading.tsx`
- Nav: `src/components/navigation/nav-config.ts`, `nav-icons.tsx`
- Domain: `prisma/schema.prisma`
- Screens: `src/app/(authenticated)/app/**/page.tsx`, `admin/**/page.tsx`
- Dashboard: `src/features/dashboard/**`
- Queue: `src/features/leads/components/my-queue-*.tsx`, `my-queue.ts`
- Intelligence UI: `src/features/leads/components/intelligence/**`
- Pipeline: `src/features/pipeline/components/**`
- Auth marketing: `src/features/auth/components/auth-brand-panel.tsx`
- Portfolio naming: `src/app/(authenticated)/app/portfolio/page.tsx` vs `WeeklyPortfolio` in schema / `weekly-portfolio-banner.tsx`

---

## Closure

Phase 0 complete. **No production code changed.**  
Next step (only when requested): start **F1 — Clarity & correctness**.

---

## Implementation status (F1)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F1_REPORT.md`

| Finding | Status |
|---------|--------|
| Portfólio vs Carteira (user-facing) | **DONE** — demos labeled **Demos** / **Demos comerciais**; carteira copy unchanged |
| `/app/leads` Text import empty state | **ALREADY FIXED in HEAD** — no code change; see F1 report discrepancy |
| Aquisição nav vs ADMIN gate | **DONE** — nav `visibility: "admin"`; server `requireRole(ADMIN)` unchanged |

F2+ findings remain open (density, intelligence naming, pipeline, auth brand, etc.).

---

## Implementation status (F2)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F2_REPORT.md`

| Finding | Status |
|---------|--------|
| Radius semantic tokens (`control` / `surface`) | **DONE** — `button`/`card` kept as aliases |
| textStyles body/data | **DONE** |
| AppCard adoption | **DONE** — `Card.Root` in `@/components/ui` defaults to AppCard |
| Border > shadow | **PRESERVED** — no new shadows |
| Shared table chrome | **DONE** — `AppTableRoot`; LeadTable consumer |
| Shell focus ring brand | **DONE** |
| Auth visual cleanup | **DEFERRED** (explicit exclusion) |
| Screen IA redesigns | **NOT STARTED** |

---

## Implementation status (F3)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F3_IA_REPORT.md`  
**Type:** Read-only operational IA audit (no UI code changes)

| Outcome | Status |
|---------|--------|
| Four-surface job analysis | **DONE** |
| Recommended target IA | **Option A** — Fila primary; rename Inteligência; keep Pipeline + Leads secondary |
| UI / nav implementation | **STARTED in F4** — Prioridades rename + Minha fila redesign |

---

## Implementation status (F4)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F4_REPORT.md`

| Outcome | Status |
|---------|--------|
| Minha fila row-first daily queue | **DONE** |
| Remove summary KPI cards from page | **DONE** |
| Compact carteira context | **DONE** |
| Title unify Minha fila | **DONE** |
| Inteligência → Prioridades (user-facing) | **DONE** — route `/app/intelligence` preserved |
| Business logic / allocation / score calc | **UNCHANGED** |
| Other screens redesign | **NOT STARTED** (Leads → F5) |

---

## Implementation status (F5)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F5_REPORT.md`

| Outcome | Status |
|---------|--------|
| Leads searchable inventory | **DONE** |
| Stage filter | **DONE** |
| Owner filter (ADMIN) | **DONE** |
| Table density + mobile rows | **DONE** |
| MyQueueSummaryCards removal | **DONE** |
| Pagination | **DEFERRED** (documented) |
| Authenticated visual QA (F4+F5) | **UNBLOCKED in F8** |
| Business logic / ACL | **UNCHANGED** |
| Prioridades / Pipeline redesign | **NOT STARTED** (Prioridades → F6) |

---

## Implementation status (F6)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F6_REPORT.md`

| Outcome | Status |
|---------|--------|
| Prioridades dense ranked list | **DONE** |
| Explainability (signals + diagnostic + Places) | **DONE** (PARTIAL data) |
| Distinction from Fila / Leads copy | **DONE** |
| Score calculation / AI calls | **UNCHANGED** |
| Authenticated visual QA (F4–F6) | **UNBLOCKED in F8** |
| Pipeline redesign | **NOT STARTED** |

---

## Implementation status (F7)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F7_REPORT.md`

| Outcome | Status |
|---------|--------|
| Pipeline dense stage sections | **DONE** |
| Compact lead rows (no card grid) | **DONE** |
| Preview density 3 → 8 | **DONE** |
| Stage transition / DnD | **UNCHANGED** (detail-only; no DnD) |
| Authenticated visual QA (F4–F7) | **UNBLOCKED in F8** |
| Equipe / Auth / global polish | **NOT STARTED** |

---

## Implementation status (F8)

**Date:** 2026-09-29  
**Report:** `docs/audits/PROSPECTA_PRODUCT_UI_F8_QA_REPORT.md`

| Outcome | Status |
|---------|--------|
| Auth blocker diagnosis | **DONE** — config: prod Neon + Upstash in `.env`; local Docker QA restored via session overrides |
| Authenticated visual QA F4–F7 | **DONE** (desktop / medium / mobile) |
| Relevant E2E executed | **DONE** — auth/nav/fila/leads/prioridades/pipeline/portfolio/breadcrumbs/nav-badges |
| Verified defects fixed | **DONE** — Leads search label; Pipeline link a11y + E2E scope |
| Gate | **PASS WITH DEBT** |
| Equipe / Auth / Demos redesign | **NOT STARTED** |
| Business logic | **UNCHANGED** |
