# Commercial Navigation IA v1 — Decision BUILD

- **Data:** 2026-08-13
- **Decisão:** **BUILD** (IA da navegação) + **DEFER** (dashboard/KPIs, badges, conta)
- **Classificação:** PLATFORM
- **Relacionado:** [mobile-experience](product-decision-mobile-experience-v1.md), [breadcrumb](product-decision-breadcrumb-navigation-v1.md), [dashboard defer](product-decision-dashboard-defer.md)

## Product Decision

```text
Header horizontal com 7 itens no mesmo nível
    → Commercial Navigation IA v1: BUILD
Dashboard / KPIs / badges / Minha conta: DEFER
    (dashboard já deferido; sem inventar métrica)
```

## Problema

O menu mistura operação diária, base comercial e administração no mesmo nível. `Minha fila` compete visualmente com `Leads`, `Portfólio` e `Usuários`. `/app` fica fora do menu.

## Evidência

Hipótese de information architecture (founder). Sem métrica de abandono por menu. Permissões atuais já estão corretas; o problema é peso visual e linguagem.

## Hipótese

Agrupar por domínio (Operação / Base comercial / Gestão) + sidebar ↓ tempo para achar a tela certa e deixa Minha fila como workspace principal.

## Comportamento esperado

- Desktop: sidebar fixa, recolhível (240px / 64px), agrupada.
- Mobile: bottom nav `Fila · Inteligência · Pipeline · Mais`.
- `Usuários` passa a se chamar **Equipe** (mesma rota `/admin/users`).
- `/app` entra no menu como **Visão geral** (atalhos existentes; sem KPIs).
- Permissões inalteradas: Aquisição = ADMIN ou MEMBER.`canRunAcquisition`; Equipe e Revisão HIGH = ADMIN.
- MEMBER com aquisição vê Aquisição em Base comercial.
- ContextualNav do lead permanece.

## Métrica

Observação manual no piloto: operador encontra Minha fila / Pipeline / Equipe sem hesitar. E2E: sidebar desktop, Fila no mobile, MEMBER sem Equipe, logout pelo perfil.

## Escopo autorizado

1. Sidebar desktop agrupada + recolhível + tooltip no estado ícone.
2. Perfil no rodapé da sidebar com **Sair** (sem páginas novas de conta).
3. Bottom nav mobile: label `Fila`.
4. Página Mais agrupada (Geral / Gestão / Conta).
5. Rename Usuários → Equipe na nav, heading e breadcrumb.
6. Visão geral em `/app` (título + CTA para a fila).

## Fora

- Dashboard com meta/tratados/pendentes (ver [dashboard defer](product-decision-dashboard-defer.md)).
- Badges de ação pendente no menu.
- Submenus (Aquisição/Equipe/Materiais).
- Páginas Minha conta / Configurações.
- Mudança de ACL ou rotas.

## Revenue-centric

- **Objetivo:** chegar ao trabalho do dia (fila) sem varrer um menu técnico.
- **Fricção atual:** 7 links iguais; `/app` invisível.
- **Menor alteração:** só IA/shell; páginas internas intactas.
- **Proteção:** MEMBER continua sem Equipe; ContextualNav e bottom nav permanecem.
