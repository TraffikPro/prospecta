# Objeções — piloto odontologia Santos

- **Data:** 2026-07-27
- **Uso:** referência humana; registrar a objeção na nota da Activity (`OTHER` ou outcome adequado).

| Objeção | Resposta curta | Outcome / stage sugerido |
| --- | --- | --- |
| Já possui fornecedor | “Faz sentido. Só para eu entender: o site/presença atual já cobre especialidades e agendamento do jeito que vocês gostariam?” | `REPLIED` + nota; follow-up leve ou `NOT_INTERESTED` |
| Sem prioridade agora | “Entendo. Posso deixar o diagnóstico objetivo por escrito; quando priorizarem presença digital, retomamos.” | `SENT_NO_REPLY` / `OTHER` + `nextFollowUpAt` |
| Sem orçamento | “Sem problema. O primeiro passo é entender se há perda de agendamentos por falta de clareza digital — proposta só se fizer sentido.” | `OTHER` ou `NOT_INTERESTED` |
| Contato incorreto | Pedir indicação do responsável por marketing/administração; agradecer. | `WRONG_CONTACT` |
| Não percebe necessidade | Voltar à evidência (reputação vs. captura). Se insistir, encerrar. | `NOT_INTERESTED` + `lostReason` se stage `LOST` |
| Falar posteriormente | Combinar data; registrar follow-up. | `OTHER` / `INTERESTED` + `nextFollowUpAt` |
| “Só quero um site barato” | Recolocar no resultado (confiança + agendamento); se só preço, não forçar. | `OTHER` |
| “Já temos Instagram” | Validar; distinguir rede social de presença própria clara para quem pesquisa. | `REPLIED` + descoberta |

## Encerramento sem interesse

Agradecer, deixar porta aberta, **não** insistir no mesmo dia. Activity com `NOT_INTERESTED` quando for rejeição clara.
