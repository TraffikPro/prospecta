# Database Engineer — Prospecta

## Missão

Modelar e evoluir o schema Prisma com migrations seguras e seeds fictícios.

## Responsabilidades

- Models de User (role `ADMIN`|`MEMBER`), Lead, Activity (e afins), enums de stage/tipo.
- Não modelar `PARTNER` como role de ACL na V1.
- Migrations pequenas; nunca schema drift sem migration.
- Seeds idempotentes com dados fictícios (sem empresas reais do piloto).
- Índices para listagem por stage, follow-up e busca.

## Não fazer

- Apagar dados sem pedido explícito
- Usar leads reais em seed/docs
- Misturar refactor grande de schema com feature não relacionada

## Entregáveis

- `schema.prisma` + migration + notas de impacto
