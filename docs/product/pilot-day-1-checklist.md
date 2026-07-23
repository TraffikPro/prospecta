# Pilot Day 1 Checklist

Checklist final antes de iniciar a prospecção real.  
Quando estiver completo → marco **Pilot Day 1 Ready**.

Tese: [founder-pilot.md](founder-pilot.md)  
Execução diária: [founder-pilot-execution.md](founder-pilot-execution.md)

**Congelado até evidência do piloto:** features novas, refatorações não críticas, UI por preferência.

---

## Antes de iniciar (ordem recomendada)

### 1. Deploy acessível

- [ ] App em produção (ex.: Vercel)
- [ ] Postgres gerenciado (não só local)
- [ ] `DATABASE_URL` / `AUTH_SECRET` / seed passwords de produção configurados
- [ ] Smoke pós-deploy:
  - [ ] login dos 3 sócios
  - [ ] criar lead
  - [ ] registrar Activity
  - [ ] mover stage no pipeline
  - [ ] dados persistem após reload / novo login

### 2. Três usuários de operação

- [ ] `ADMIN` — Gustavo (produto/tecnologia)
- [ ] `MEMBER` — Sócio Comercial
- [ ] `MEMBER` — Sócio Operações
- [ ] Cada um consegue entrar e operar o papel esperado

### 3. Backup definido

- [ ] Backup automático do Postgres ligado (ou política do provedor)
- [ ] Quem tem acesso ao painel / restore está definido
- [ ] Como recuperar está anotado (1 parágrafo basta)

### 4. Nicho definido

- [ ] **Um** nicho escolhido (não “B2B genérico”)
- [ ] Região / cidade definida
- [ ] Hipótese escrita em [founder-pilot-execution.md](founder-pilot-execution.md) §2

Exemplos: clínicas odontológicas · imobiliárias · advocacias.

### 5. Lista inicial pronta

- [ ] ~**20** empresas preparadas para o dia 1 (meta da janela ~50)
- [ ] Cada lead entra com: empresa · contato · site · diagnóstico (`notes`)

### 6. Script de abordagem aprovado

- [ ] Mensagem inicial alinhada
- [ ] Follow-up alinhado
- [ ] Cadência definida (ex.: D1 → D3 → D7)
- [ ] Combinado: cada tentativa = Activity

### 7. Ritual marcado

- [ ] Check-in diário (10 min) no calendário / canal
- [ ] Check-in semanal (45 min) marcado

---

## Durante o piloto (14 dias)

- [ ] Todo lead no Prospecta (sem planilha como fonte da verdade)
- [ ] Toda interação vira Activity
- [ ] Todo lead aberto tem `nextFollowUpAt` **ou** está em `WON` / `LOST`
- [ ] Sem feature nova sem `product-grill` → **BUILD**

---

## Após 14 dias

- [ ] Fechar métricas (operação + comercial + produto)
- [ ] Responder: o Prospecta ajudou ou atrapalhou?
- [ ] Decidir próximo investimento:
  - volume baixo → aquisição
  - conversão baixa → oferta / processo
  - operação travada → melhoria no Prospecta
  - escala → automação (só com evidência; Maps continua DEFER até critério do piloto)

---

## Assinatura do marco

| Campo | Valor |
| --- | --- |
| Data “Day 1 Ready” | _AAAA-MM-DD_ |
| Nicho | |
| Deploy URL | |
| Confirmado por (3 sócios) | |

Quando a seção **Antes de iniciar** estiver 100% marcada, começar a prospecção real.
