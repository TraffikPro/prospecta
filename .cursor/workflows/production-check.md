# Workflow — Production check

Verificação de deploy/smoke do Prospecta (usar antes de promover mudanças relevantes).

## Variáveis

- [ ] `DATABASE_URL` apontando para o banco certo
- [ ] Credenciais/auth do time (sem segredo no git)
- [ ] `NEXT_PUBLIC_APP_URL` (domínio real https em produção)

## App / canais

- [ ] Login do time fundador funciona (`ADMIN` e `MEMBER`)
- [ ] `MEMBER` não acessa ações exclusivas de `ADMIN`
- [ ] Templates WhatsApp geram link `wa.me` coerente
- [ ] E-mail via `mailto`/template coerente

## Banco e app

- [ ] Migrations aplicadas
- [ ] Seed (se houver) revisado — sem PII real indevida
- [ ] Domínio/DNS (Vercel ou equivalente) ok
- [ ] Build de produção ok

## Fluxo prospecção

- [ ] Criar lead
- [ ] Registrar atividade + follow-up
- [ ] Mover stage
- [ ] Abrir WhatsApp/e-mail a partir do lead salvo
- [ ] Usuário não autenticado não vê leads

## Resultado

- **GO** ou **NO-GO** com blockers listados
