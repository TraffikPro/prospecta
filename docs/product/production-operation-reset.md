# Production Operation Reset

**Status:** READY FOR EXECUTION  
**Data:** 2026-07-23  
**Classificação:** WORKSPACE (operação do piloto)

## Objetivo

Remover **estado de teste** do banco operacional antes do lote comercial Santos Odontologia, sem apagar testes de engenharia (`e2e/`, unitários, seed local).

```text
Ambiente de desenvolvimento     Produção operacional
├── seeds                       ├── usuários reais (intactos)
├── E2E                         ├── leads reais (após reingestão)
├── testes                      ├── activities reais
└── dados artificiais           └── histórico comercial
```

## Escopo v1 do script

| Ação | v1 |
| --- | --- |
| `Activity` | deleteMany |
| `Lead` | deleteMany (inclui Places/HIGH de experimento) |
| `User` | **não remove** (cleanup opcional em fatia futura) |
| Schema / migrations | intactos |
| `e2e/` e testes | intactos |

Leads Google Places atuais são tratados como **experimento descartável**. Após o reset: Inbox vazia → reingerir → lote Santos oficial.

## Separação

- **Não apagar testes** — seguro do produto.
- **Apagar estado de teste** — Activities + Leads no alvo `DATABASE_URL`.

## Estado inicial desejado

```text
Usuários reais (preservados)
+
0 leads
+
0 activities
+
pipeline / Inbox limpos
```

## Comando

```bash
pnpm db:reset-pilot           # dry-run (default)
pnpm db:reset-pilot --apply   # exige CONFIRM_PILOT_RESET=YES
```

Duas travas no apply:

1. flag `--apply`
2. env `CONFIRM_PILOT_RESET=YES`

Antes do delete (apply), o script grava backup lógico **sem senha**:

```text
backup/pilot-reset-YYYY-MM-DDTHHMMSS.json
```

Conteúdo: usuários (id, email, name, role, isActive), leads, activities.

`backup/` fica fora do git (PII).

## Checklist de execução

1. Criar snapshot/branch no Neon Console (backup de infra)
2. Apontar `DATABASE_URL` para o alvo correto
3. `pnpm db:reset-pilot` (dry-run) — conferir contagens
4. Confirmação explícita do operador
5. `CONFIRM_PILOT_RESET=YES pnpm db:reset-pilot --apply`
6. Smoke login ADMIN + MEMBER (contas reais)
7. Conferir Inbox / pipeline vazios
8. Reingerir Santos HIGH
9. Executar lote: [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md)

**Não** rodar Playwright E2E contra produção após o reset (recria lixo).

## Relação com VALIDATE

Product Decision do lote: VALIDATE — [campaign-santos-odonto-batch-1.md](campaign-santos-odonto-batch-1.md).  
Este reset só prepara o banco; não autoriza Campaign entity / Workspace / Website Intelligence.
