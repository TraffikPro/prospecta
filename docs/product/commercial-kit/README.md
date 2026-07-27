# Kit Comercial Mínimo — DevFlow Labs × Prospecta

- **Decisão:** BUILD documental (sem código de produto)
- **Classificação:** PILOT_SPECIFIC
- **Data:** 2026-07-27
- **Campanha:** `santos-odontologia-2026-07-27-gate`
- **CRM:** Prospecta `main` @ produção
- **Generator (fonte do lote):** `prospecta-lead-generator` @ `a8a47f6` · Score V2 · LIVE sync 2026-07-27

## Papéis

| Sistema | Responsabilidade |
| --- | --- |
| `prospecta-lead-generator` | coletar → qualificar → selecionar → sincronizar |
| **Prospecta + este kit** | lead → diagnóstico → contato → Activity → reunião → proposta |

## Objetivo

Transformar os 5 leads sincronizados em conversas profissionais, com oferta clara, diagnóstico verificável e processo de evidência no CRM — **antes** de novas fatias no extrator.

## Conteúdo

| Arquivo | Uso |
| --- | --- |
| [offer-pilot.md](offer-pilot.md) | Oferta-piloto (resultado, não “só um site”) |
| [lead-diagnostics/](lead-diagnostics/) | Ficha por lead (evidência / hipótese / pergunta) |
| [outreach-playbook.md](outreach-playbook.md) | Roteiro da conversa |
| [objections.md](objections.md) | Objeções e respostas |
| [prospecta-activity-mapping.md](prospecta-activity-mapping.md) | Mapear intenção → enums **existentes** |
| [proposal-template.md](proposal-template.md) | Esqueleto de proposta |
| [devflow-presence-checklist.md](devflow-presence-checklist.md) | Landing + WhatsApp Business (fora deste repo) |

## Guardrails

- Diagnósticos só com evidências verificadas (Places / Score V2 / sync report).
- Sem telefone completo nem PII sensível em docs versionados (máscara `XXXX***`).
- Separar **evidência**, **hipótese** e **pergunta de descoberta**.
- `/app/portfolio` = **demonstrativo** (modelo / site-conceito), não case de cliente.
- **Não** criar enums, migrations ou código no Prospecta neste BUILD.
- Landing e WhatsApp = checklist; implementação fora deste repositório.
- Sem disparo automático, IA de mensagem ou mudança de Score V2.

## Ordem operacional sugerida

1. Oferta + presença mínima (checklist DevFlow).
2. Ler os 5 diagnósticos + histórico dos 3 `EXISTS` no CRM.
3. Contatar **2** leads (evitar Odonto Village no primeiro par — reputação mista).
4. Registrar Activity no Prospecta.
5. Ajustar abordagem → demais leads.
6. Proposta só com aderência explícita.

## Lote sincronizado (referência)

| Lead | Sync LIVE | Score |
| --- | --- | ---: |
| Clínica Brasil Sorriso - Gonzaga | EXISTS | 85 |
| Centro Santista de Odontologia | EXISTS | 85 |
| Drª Ariany de França Ferreira | EXISTS | 85 |
| Odontologia Especializada 24h | CREATED | 75 |
| Odonto Village | CREATED | 70 |

Fonte sync: `sync-report-santos-odontologia-2026-07-27-gate` · created=2 · existing=3 · failed=0.
