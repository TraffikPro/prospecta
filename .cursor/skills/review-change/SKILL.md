---
name: review-change
description: Revisão defect-first de um diff, focada em ownership, ACL, PII, migrations, production safety e regressões.
---

# Review a change

Usar antes de declarar trabalho arriscado como concluído, ou quando uma revisão for pedida.
Findings primeiro; não recontar o que a mudança faz.

## 1. Diff real

Ler o diff staged e unstaged, ou contra a branch base. Revisar o que está no disco, não a memória da implementação.

## 2. Escopo

- Arquivos fora do escopo declarado, e se isso era necessário.
- Alterações do usuário revertidas ou reformatadas sem pedido.
- Migrations, dependências, env, infraestrutura ou contratos públicos tocados sem fazer parte do pedido.
- Secrets, `.env`, credenciais ou artefatos locais staged.

## 3. Defect pass

Para cada arquivo alterado, nesta ordem:

1. Autorização em toda operação por ID: role, `ownerId`, permissão específica, no servidor. `MEMBER` não lê nem muta lead de outro owner. Duplicidade cross-owner não revela `existingLeadId`.
2. Input validado na fronteira (Zod). Server Action / Route Handler autoriza o caller no próprio handler.
3. PII: nome, telefone, e-mail, empresa — mínimo necessário; nada disso em logs, erros ou seeds.
4. Caminhos de erro: falha, timeout, entrega duplicada, escrita parcial.
5. Dados: passo destrutivo ou irreversível, transação ausente, rollback ausente. Migration: SQL lido, impacto nos dados existentes.
6. Produção: nenhuma mutação remota sem autorização; testes mutáveis só em banco local/efêmero com guard.
7. Concorrência: estado compartilhado, race read/write, constraint que o código finge garantir.
8. Regressões: callers existentes de assinatura, query ou payload alterados.

## 4. Evidência de validação

Confirmar quais checks rodaram (`pnpm lint`, `pnpm typecheck`, testes relevantes) e quais não, e por quê. Só typecheck não verifica o comportamento.

## 5. Report

Findings por severidade. Cada um: arquivo, linha, impacto concreto, correção específica. Se nada for encontrado, dizer isso.
