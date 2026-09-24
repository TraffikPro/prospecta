---
name: plan-task
description: Planeja implementação técnica depois de product-grill com decisão BUILD. Não substitui descoberta de produto.
---

# Plan a task

Usar quando o escopo técnico estiver pouco claro, a mudança cruzar módulos, ou a superfície for de alto risco.
Pular para trabalho mecânico já especificado.

## Pré-condição

`product-grill` decide **SE** construir. Esta skill decide **COMO** implementar uma decisão já autorizada.

- Feature, UI/UX ou mudança operacional: exigir `product-grill` com **BUILD**. Sem BUILD, parar.
- `REDUCE SCOPE` não autoriza esta skill. Reabrir o grill.
- Exceções do grill (segurança crítica, integridade, regressão bloqueadora) seguem sem BUILD comercial; ainda assim planejar tecnicamente aqui.

Não reabrir descoberta de produto. Consumir o BUILD: problema, hipótese, métrica, menor implementação autorizada.

## DISCOVER

1. Restate o resultado pedido em uma frase, incluindo o que está fora de escopo.
2. Localizar o código por termos de domínio, símbolos, rotas e erros. Preferir busca pontual a listar diretórios.
3. Abrir os arquivos que a busca apontar. Seguir dependência só quando a tarefa depende do comportamento dela.
4. Ler comandos canônicos no `package.json` / README: lint, typecheck, test, migrate.

Parar de descobrir quando for possível nomear cada arquivo a mudar e cada contrato que não pode quebrar.

## SCOPE

Registrar:

- arquivos a alterar, e por quê
- contratos que não podem quebrar: APIs, schema, payloads, ACL/`ownerId`
- superfícies de risco: auth, PII, migrations, produção
- o que deliberadamente não será tocado

## PLAN

Passos ordenados, cada um verificável. Menor fatia reversível que entrega o BUILD. Não continuar em trabalho não pedido.

Perguntar só quando a decisão muda o resultado. Ambiguidade de produto: reportar, não inventar regra.

## Report

Objetivo, escopo, passos com validação, perguntas em aberto. Se o grill produziu `## Product Decision`, preservar essa seção no plano.
