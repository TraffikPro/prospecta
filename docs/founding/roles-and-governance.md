# Papéis fundadores e governança

Separa **sociedade** de **autorização no software**. O risco principal antes do código é operar sem regras explícitas entre sócios.

## Sociedade (`PARTNER`)

Os três fundadores são `PARTNER` em relação ao negócio:

```text
Gustavo — Sócio de Produto e Tecnologia
Sócio 2 — Sócio Comercial/Prospecção
Sócio 3 — Sócio de Operações/Relacionamento
```

`PARTNER` **não** é um enum de permissão do app na V1.

## Permissões no sistema (V1)

| Papel | Pode (resumo) | Não precisa (resumo) |
| --- | --- | --- |
| `ADMIN` | Usuários, configuração, importação, visão completa, ações sensíveis | — |
| `MEMBER` | Leads, contatos, atividades, pipeline | Configuração técnica, ações destrutivas |

Bootstrap sugerido do piloto:

- Gustavo → `ADMIN`
- Sócio comercial → `MEMBER`
- Sócio operacional → `MEMBER`

Futuro (técnico do workspace, não societário): `OWNER` / `ADMIN` / `MEMBER`.

## Responsabilidades operacionais

### Produto e Tecnologia (Gustavo)

- Desenvolvimento do Prospecta
- Arquitetura e segurança
- Métricas do produto
- Priorização do roadmap
- Deploy e manutenção
- Traduzir necessidade comercial em funcionalidade

### Comercial / Prospecção (Sócio 2)

- Definição do ICP
- Construção das listas
- Criação das abordagens
- Execução da prospecção
- Diagnóstico das objeções
- Validação da disposição de compra

### Operações / Relacionamento (Sócio 3)

- Organização dos leads
- Acompanhamento dos retornos
- Manutenção do pipeline
- Follow-ups
- Registro das atividades
- Avaliação de usabilidade por quem não desenvolve

Cada área precisa de **um responsável final**; o detalhe pode evoluir com evidência do piloto.

## Checklist — definir antes (ou no início) do desenvolvimento

Registrar por escrito (acordo entre sócios). **Não inventar valores aqui** — preencher com o que o time decidir.

| Tema | Status | Nota |
| --- | --- | --- |
| Participação de cada sócio | Pendente | Evitar default automático 33,33%; considerar contribuição, risco, dedicação, capital e responsabilidade contínua |
| Responsabilidades (RACI leve) | Parcial | Espelho da tabela acima; ajustar nomes reais |
| Dedicação esperada (horas/semana ou entregáveis) | Pendente | |
| Quem investe dinheiro (e em quê) | Pendente | Domínio, infra, tools, ads |
| Propriedade intelectual do sistema | Pendente | Código, marca, dados de prospecção |
| Regra de entrada de novo sócio | Pendente | |
| Regra de saída de sócio | Pendente | |
| Distribuição de receitas | Pendente | |
| Poder de decisão (o que é unânime vs maioria vs área) | Pendente | Ex.: produto técnico vs ICP comercial |
| Tratamento de impasses | Pendente | |
| Titularidade: domínio | Pendente | |
| Titularidade: GitHub / repositório | Pendente | |
| Titularidade: banco de dados | Pendente | |
| Titularidade: contas de infra (Vercel, DNS, e-mail) | Pendente | |
| O que acontece se alguém parar de contribuir | Pendente | Vesting, diluição, buyout — a combinar |

Enquanto um item estiver **Pendente**, não assumir regra implícita no código nem em docs de produto.

## Ligação com o produto

- Modelo de auth V1: apenas `ADMIN` | `MEMBER` (ver `docs/product.md`).
- Piloto: [product/pilot-validation-plan.md](../product/pilot-validation-plan.md).
- Decisões de engenharia duradouras: `docs/adr/`.
