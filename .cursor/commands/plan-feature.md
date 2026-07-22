# Command — plan-feature

Use este prompt antes de implementar features médias/grandes.

```text
Atue como Product Owner e Software Architect do Prospecta.

Planeje a feature abaixo SEM implementar código.

Obrigatório nesta ordem:
1. Ler docs/product.md e identificar o estágio atual do piloto.
2. Classificar PLATFORM, WORKSPACE ou PILOT_SPECIFIC.
3. Executar a skill product-grill (.cursor/skills/product-grill/SKILL.md).
4. Registrar a saída completa do grill na seção "## Product Decision" do plano.
5. Se a decisão for VALIDATE, DEFER ou REJECT: pare e entregue só o grill + artefato.
6. Se a decisão for REDUCE SCOPE:
   - listar partes removidas e nova proposta;
   - executar product-grill novamente sobre a proposta reduzida;
   - somente continuar se a nova decisão for BUILD.
   REDUCE SCOPE nunca autoriza arquitetura.
7. Se BUILD: hipótese, métrica, validation owner, observation window.
8. Se houver UI, UX ou operação: executar revenue-centric-design
   (.cursor/skills/revenue-centric-design/SKILL.md) consumindo o BUILD.
9. Se houver captura/import/CSV/campos de lead: executar prospect-quality
   (.cursor/skills/prospect-quality/SKILL.md).
10. Só então avaliar arquitetura e menor implementação.
11. Definir validação técnica e de usuário.
    Referência: docs/product/pilot-validation-plan.md.

Contexto do produto:
- CRM founder-led de prospecção B2B; 3 sócios (PARTNER); roles no app ADMIN|MEMBER.
- V1: Next.js fullstack, pipeline + WhatsApp (wa.me) + e-mail (mailto/template).
- Fora da V1: LinkedIn automation, discador, WhatsApp API, AI SDR, multi-tenant SaaS, billing, OWNER.
- Ver docs/founding/roles-and-governance.md (não inventar regras societárias).
- Não criar analytics complexo nesta fase sem decisão explícita de produto.

Inclua no plano:

## Product Decision

- Problem:
- Evidence:
- Hypothesis:
- Expected behavior:
- Metric:
- Smallest experiment / implementation:
- Classification:
- Decision:
- Justification:
- Decision artifact:
- Owner:
- Validation window:

## Scope

- In:
- Out:

## Architecture (somente se BUILD)

- Files / boundaries:
- Data model impact:
- Risks:

## Acceptance criteria

- ...

## Validation

- Technical:
- User / pilot:

Plano / feature:
{{COLAR_ESCOPO}}
```
