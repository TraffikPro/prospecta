# ADR 0003 — Roles de autorização V1 (ADMIN / MEMBER)

- **Status:** accepted
- **Data:** 2026-07-22
- **Relacionado:** [roles-and-governance.md](../founding/roles-and-governance.md)

## Contexto

Os três fundadores são `PARTNER` na sociedade, mas não devem ter as mesmas permissões técnicas. É preciso um ACL simples no app sem modelar sociedade no software.

## Decisão

- Roles de software na V1: **`ADMIN`** | **`MEMBER`** apenas.
- `PARTNER` não é claim de ACL nem enum de `User.role`.
- `ADMIN`: import CSV, gestão de usuários/roles, delete de lead, export CSV, além do que `MEMBER` faz.
- `MEMBER`: leads, owner, pipeline, atividades, handoff WhatsApp/e-mail.
- Autorização sempre no server.
- Role `OWNER` fica fora da V1.

## Alternativas consideradas

- Um único papel para os três — risco em ações destrutivas e import.
- Usar `PARTNER` como role — mistura sociedade com ACL.
- RBAC granular por recurso — overengineering para 3 usuários.

## Consequências

- Seed/bootstrap: 1 `ADMIN` + 2 `MEMBER`.
- Testes de autorização cobrem pelo menos import/delete negados a `MEMBER`.
- UI esconde/desabilita ações de `ADMIN` com mensagem clara; server é a barreira real.
