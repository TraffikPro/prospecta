# Plano de validação do piloto — Prospecta

Plano **técnico/operacional** do fluxo no app. Para objetivo comercial (venda de sites), nicho, qualificação e DEFER do Maps, ver [founder-pilot.md](founder-pilot.md).

## Contexto

Produto **founder-led**: três sócios operam prospecção real no Prospecta.

| Dimensão | V1 |
| --- | --- |
| Sociedade | 3× `PARTNER` |
| Sistema | 1× `ADMIN` + 2× `MEMBER` |
| Decisão de produto | **BUILD** — [product-decision-mvp-technical.md](product-decision-mvp-technical.md) |
| Canais | CRM + `wa.me` + `mailto` |
| Stack | Next.js fullstack + Prisma + PostgreSQL |

## Hipótese

Se o fluxo vertical for usável pelos sócios `MEMBER`, em 2 semanas após deploy usável ≥70% dos leads abertos terão próximo passo ou stage terminal — sem planilha paralela como fonte da verdade.

## Escopo a validar

O fluxo:

```text
login → lead → responsável → pipeline → atividade → WhatsApp/e-mail → resultado + próximo passo
```

Inclui: stages/critérios, dedupe leve, ACL `ADMIN`/`MEMBER`, filtro de parados/atrasados.  
Exclui: dashboard, IA, automações, APIs oficiais (ver `docs/product.md`).

## Métricas

| Métrica | Sucesso (piloto) |
| --- | --- |
| % leads abertos com `nextFollowUpAt` futuro ou `WON`/`LOST` | ≥ 70% |
| Sócios `MEMBER` operam sem ajuda técnica contínua | Sim após onboarding |
| ≥1 `MEETING` ou `WON` registrado no app | Sim na janela |
| Follow-ups em atraso / parados | Visíveis em lista/filtro |
| Feedback de usabilidade (Operações) | Registrado no check-in semanal |

### Definições usadas na medição

- **Parado:** stage aberto e (`nextFollowUpAt` no passado ou sem follow-up e sem atividade ≥7 dias).
- **Perdido / convertido:** stages `LOST` / `WON`.
- **Contato feito:** atividade `WHATSAPP` ou `EMAIL` persistida (não o clique).

## Owners e ritual

| Área | Owner |
| --- | --- |
| Métricas de uso / produto | Gustavo |
| ICP / qualidade comercial | Sócio Comercial |
| Pipeline / usabilidade | Sócio de Operações |

- **Janela:** 2 semanas após primeiro deploy usável.  
- **Check-in:** 15 min / semana entre os três.  
- **Ajuste / stop:** ver [product-decision-mvp-technical.md](product-decision-mvp-technical.md) e critérios abaixo.

### Ajuste

- Campo pedido repetidamente → novo grill.  
- E-mail não usado → esconder/simplificar.  
- CSV ruim → apertar validação (`ADMIN`).  
- Modal de atividade abandonado → considerar “handoff pendente” (V1.1 só com evidência).

### Stop

- Perda de dados / stages inconsistentes.  
- Registrar atividade mais lento que a planilha.  
- Vazamento de PII.  
- Impasse societário bloqueando priorização sem checklist mínimo.

## Pós-feature

1. `product-grill` → só **BUILD**  
2. UI/operação → `revenue-centric-design`  
3. Captura/CSV → `prospect-quality`  
4. PR com `## Product Decision`  
5. Observação com owner de área
