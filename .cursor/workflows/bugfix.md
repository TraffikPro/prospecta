# Workflow — Bugfix

## 1. Reproduzir

- Passos, rota, dados de entrada, resultado esperado vs atual
- Ambiente (local/preview/prod) e se há lead/atividade/WhatsApp/e-mail envolvido

## 2. Isolar causa

- UI vs action vs Prisma vs formatter/import
- Confirmar se stage/autorização veio do client indevidamente

## 3. Corrigir o mínimo

- Patch focado; sem “já que estou aqui” em refactor grande
- Preservar fluxo salvar → canal → atividade

## 4. Regressão

- Adicionar teste se a lógica for estável (Zod, templates, CSV, stage)
- Rodar validações do projeto

## 5. Reportar

- Causa raiz, fix, arquivos, teste adicionado (ou por que não)
