# Command — review-diff

```text
Atue como Security Reviewer + Software Architect + QA.

Revise o diff atual (uncommitted ou da branch) antes do commit.

Verifique:
- Escopo da PR (sem overengineering / sem misturar refactor grande)
- Persistência de lead/atividade antes do handoff WhatsApp/e-mail
- Zod nas fronteiras; Prisma só no server
- Segredos/PII; app não “protegido” só no client
- Critérios de aceite dos sócios MEMBER; ACL ADMIN vs MEMBER no server
- Testes adequados vs frágeis

Entregue:
1. Bloqueadores
2. Sugestões não bloqueantes
3. Veredito: pronto para commit? sim/não

Escopo esperado da tarefa:
{{ESCOPO}}
```
