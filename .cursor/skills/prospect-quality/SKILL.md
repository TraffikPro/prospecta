---
name: prospect-quality
description: >-
  Garante qualidade mínima de leads e listas (campos, dedupe leve, CSV limpo,
  anti-lixo) antes de importar ou modelar captura. Use ao criar/alterar import
  CSV, formulário de lead, regras de deduplicação, templates de contato ou
  qualquer fluxo que alimenta o pipeline do Prospecta.
---

# Prospect Quality

Evita encher o CRM de lixo. Complementa `product-grill` (não o substitui).  
Normativo V1: `docs/product.md` + `docs/product/product-decision-mvp-technical.md`.

## Quando usar

- Import CSV / planilha
- Formulário de criação/edição de lead
- Regras de “lead duplicado”
- Templates WhatsApp/e-mail que dependem de campos

## Campos V1 (fechados)

**Obrigatórios:** `companyName`; `phone` **ou** `email`; `ownerId`; `stage` (default `NEW`).  
**Opcionais:** `contactName`, `title`, `website`, `notes`, `nextFollowUpAt`, `lostReason`, `wonNote`.

## Dedupe V1 (fechado)

- Duplicata: mesmo `email` **ou** mesmo `phone` (normalizados).
- Não duplicata: só mesmo `companyName`.
- Comportamento: bloquear + apontar lead existente; sem merge/fuzzy.

## Normalização

- e-mail: trim + lowercase
- telefone: dígitos; `wa.me` com `55` quando BR 10/11 dígitos
- empresa: trim / espaços colapsados

## Import CSV

- Somente `ADMIN`
- Linha inválida: erro por linha (não importar silencioso)
- Sem telefone e sem e-mail: rejeitar

## Saída ao alterar captura

1. Campos obrigatórios vs opcionais  
2. Regras de rejeição  
3. Dedupe  
4. Normalizações  
5. Mensagens para `MEMBER`  
6. Fora de escopo (enrichment, fuzzy, etc.)
