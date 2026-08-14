# Product Decision — Commercial playbook UI

- **Data:** 2026-08-14
- **Decisão:** **BUILD** a UI layer · commercial status remains **VALIDATE**
- **Classificação:** PILOT_SPECIFIC (ICP Santos / Odontologia) · WORKSPACE (detalhe do lead)
- **Branch:** `feat/commercial-playbook-ui`
- **Pré-requisito:** [playbook-v1.md](../commercial/playbook-v1.md)
- **Não autoriza:** IA, rewrite, auto-send, novos sinais, motor de cadência persistido, recycle automático, scripts genéricos, auditoria de site, e-mail como canal deste corte

## Sequência canônica

```text
F1–F4 = DONE
KPIs = DONE
DASHBOARD = DONE
BADGES = DONE
PLAYBOOK DOCS = VALIDATE
PLAYBOOK UI = BUILD agora (VALIDATE comercial)
```

## Hipótese

Se o operador ver, no lead da própria carteira, por que abordar, qual script usar e o que registrar depois, então a cadência WhatsApp é executada sem abrir o repositório.

## Revenue-centric

1. **Objetivo:** responder “o que eu mando agora?” no detalhe do lead.
2. **Comportamento atual:** playbook só em Markdown.
3. **Comportamento desejado:** copiar o template aprovado e registrar Activity.
4. **Fricção:** GitHub / script decorado / jargão `NO_WEBSITE`.
5. **Hipótese:** UI estática aumenta Activities `WHATSAPP` no lote HIGH.
6. **Métrica:** Activities + `SENT_NO_REPLY` / `REPLIED` / `INTERESTED` — sem tracking novo.
7. **Proteção:** copiar ≠ contato; ACL existente; sem mutation no render/tab/clipboard/WhatsApp.
8. **Menor alteração:** seção no detalhe do lead (Minha fila → lead). Sem dashboard / pipeline / admin.
9. **Risco:** duplicar scripts docs vs código — runtime tipado em `src/features/commercial/playbook-v1.ts`.
10. **Validação:** unitário de ICP/sinais/templates + e2e MEMBER/ADMIN/mobile.
11. **Validation owner:** Sócio Comercial (uso) · Sócio de Produto e Tecnologia (UI).
12. **Observation window:** uso real da cadência nos HIGH do lote.
13. **Success:** operador não técnico executa D0 → D+2 sem abrir Markdown.
14. **Adjustment:** se a seção distrair, recolher; não gerar copy.
15. **Rollback:** remover a seção; o Markdown e o motor F1–F4 permanecem.

## ICP na UI (não inventar nicho)

Playbook disponível somente se **todas** forem verdade, a partir do lead já autorizado:

| Campo | Regra |
| --- | --- |
| Qualificação | `resolveQualification` = `HIGH` |
| Telefone | dígitos ≥ 10 (mesmo critério do `wa.me`) |
| Nicho + cidade | `intelligence.campaign` contém `santos` **e** `odontolog` |

Sem campanha comprovável, MEDIUM/LOW, outro nicho, outra cidade ou sem telefone:

```text
Playbook comercial indisponível para este lead.
```

Sem telefone não cai para e-mail (capítulo 06 continua NEXT).

## Templates

Somente combinações documentadas. D0:

| Kind | Quando |
| --- | --- |
| A | `NO_WEBSITE` efetivo (sem website na ficha) + `HIGH_RATING` e/ou `HIGH_REVIEWS` |
| B | só `NO_WEBSITE` efetivo |
| C | `HIGH_RATING` + `HIGH_REVIEWS` (com site na ficha **ou** sem `NO_WEBSITE`) |

Website informado: nunca atacar qualidade do site; `NO_WEBSITE` não vira motivo na UI.

D+2 / D+5 / D+9: textos únicos do playbook.  
Reativação: **sem** copy aprovada verbatim → `Ainda não há abordagem aprovada para este contexto.`

Respostas rápidas: só as frases entre aspas no §04 (`Quanto custa?`, `Já tenho fornecedor`, `Agora não`). Demais cenários ficam no Markdown.

Fallback de nome: `Olá!` — nunca `undefined`.

## O que esta UI não faz

```text
VALIDATE UI
No AI
No auto-send
No new lead signals
No generic scripts
No cadence engine
No new commercial semantics
```

Etapa D0/D+2 é seletor local. Histórico de Activity continua a verdade operacional. Recycle permanece ADMIN.

## Auth

MEMBER só abre lead próprio (`ownerId`). ADMIN segue ACL existente. ICP/sinais resolvidos no server a partir do lead já autorizado — o client não decide disponibilidade.
