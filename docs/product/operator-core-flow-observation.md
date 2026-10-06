# Observação operacional — fluxo CORE (Minha fila → Activity)

- **Data:** 2026-10-06
- **Decisão:** **VALIDATE** — protocolo de observação; **não autoriza** reordenar Histórico / Activity no Lead Detail
- **Classificação:** WORKSPACE
- **Pré-condição:** SCREEN MAP FREEZE; Fatia 1 de clareza de CTA já no código

## Product Decision

```text
Hipótese: o formulário de Activity fica “longe” porque o Histórico vem antes.
Evidência atual: código (main = Histórico → Activity → Inteligência/Playbook).
Sem relato de operador ≥2: não inverter nem colapsar o Histórico.
```

## Tarefa (3–5 ciclos por operador)

1. Selecionar o próximo lead em Minha fila.
2. Preparar abordagem (playbook, se houver).
3. Abrir o canal (WhatsApp ou e-mail) — **não** conta como contato.
4. Registrar resultado + próximo passo.
5. Voltar à fila.

## O que medir (manual)

| Observação | Como coletar |
| --- | --- |
| Tempo até identificar o próximo lead | Relógio na Minha fila até o clique no lead |
| Tempo até Activity salva | Do detalhe até toast “Contato registrado” |
| Cliques / navegações | Contagem simples |
| Campos esquecidos / erros | Notas do observador |
| Pedidos de ajuda | Sim/não + tema |
| “Qual é a próxima ação?” | Frase do operador após abrir o lead |

Não inventar baseline. Comparar só com a mesma sessão (antes/depois de uma fatia de UI).

## Condição para BUILD de reorder

Implementar Histórico colapsável ou Activity acima do Histórico **somente se** pelo menos dois operadores relatarem, na mesma sessão, que o formulário ficou longe ou foi esquecido.

Sem esse sintoma: **DEFER**. Continua inline `#register-activity`. Sem modal/drawer.

## Owner

Sócio comercial / operação do piloto. Janela: uma sessão de operação.

## Relacionado (fechamento CORE UI/UX)

Validação local das melhorias de CTA, pós-save, chips, retorno à fila, follow-up e bottom nav: [docs/audits/core-ui-ux-closure/REPORT.md](../audits/core-ui-ux-closure/REPORT.md) — **VALIDADO LOCALMENTE** (2026-10-06). Não altera esta decisão VALIDATE sobre reorder.
