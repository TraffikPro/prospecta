# Análise por IA de leads — piloto pessoal

O detalhe do lead apresenta análise sob demanda, evidências públicas e histórico do último resultado. A análise não altera os dados comerciais do lead e não envia mensagens. O provedor recebe apenas o contexto autorizado mínimo e páginas públicas validadas; contatos, notas internas e inteligência bruta são omitidos.

## Produção

Configurar apenas no servidor, no ambiente Production da Vercel:

- `OPENAI_API_KEY`: segredo; nunca usar prefixo `NEXT_PUBLIC_`.
- `LEAD_AI_ANALYSIS_ENABLED=true`.
- `LEAD_AI_ANALYSIS_PROVIDER=openai`.
- `LEAD_AI_ANALYSIS_PRODUCTION_ENABLED=true`.
- `LEAD_AI_ANALYSIS_ALLOWED_USER_ID`: identificador da conta autorizada.
- `LEAD_AI_ANALYSIS_ALLOWED_EMAIL`: e-mail da mesma conta.

O piloto exige o projeto e o host/banco previstos em `live-policy.ts`. Tanto a conta quanto o acesso ao lead são revalidados no servidor. Outros administradores não recebem exceção. Simulação não é permitida na Vercel. Sem configuração completa, a execução real fica desativada.

A migration `20261112180000_lead_ai_analysis` já foi aplicada e verificada no banco de produção em 12/11/2026. Publicar este código não requer executar novamente seu SQL manualmente. Em bancos novos, seguir o fluxo normal de migrations do projeto. O índice parcial garante somente uma execução RUNNING por lead; a chave de idempotência e os bloqueios transacionais evitam duplicação e concorrência na quota.

Limites: 10 tentativas/hora e 30/dia por usuário, incluindo falhas; teto estimado de US$ 0,10 por execução e duração de 45 segundos no núcleo. Resultados tardios não substituem execuções expiradas. O relatório conserva as limitações das fontes; evidência associada não garante por si só a correção semântica de toda conclusão.

## Testes locais

`pnpm test` exige um banco PostgreSQL dedicado em loopback, chamado `prospecta_test` ou `prospecta_ci`. O preload bloqueia troca da URL após o carregamento. Nunca utilizar o banco de produção para testes mutáveis.

O fluxo de interface tem configuração própria e fica fora da suíte genérica:

```powershell
$env:DATABASE_URL='postgresql://prospecta:prospecta@127.0.0.1:5433/prospecta_test'
pnpm exec playwright test --config playwright.ai-analysis.config.ts
$env:LEAD_AI_ANALYSIS_ENABLED='false'
pnpm exec playwright test --config playwright.ai-analysis.config.ts
```

Essa configuração inicia um servidor próprio na porta 3218, usa dados fictícios e provedor simulado, sem consumo pago. A integração real local exige configuração explícita, ambiente development/test, banco dedicado e nomes de lead iniciados por `[AI DEMO]`. Não colocar testes pagos na CI.

## Operação

Entrar com a conta autorizada, abrir um lead com site público e clicar em **Analisar lead**. Conferir as fontes e recarregar a página para verificar a persistência. Para desativar o recurso, definir `LEAD_AI_ANALYSIS_ENABLED=false` e publicar novamente. Uma reversão do aplicativo pode preservar a tabela aditiva; não excluir análises automaticamente.
