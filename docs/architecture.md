# Beautly — Arquitetura técnica (1.0.0)

> Este documento assume o produto/domínio já fechado em [`../CONTEXT.md`](../CONTEXT.md) e [`mvp-1.0.0.md`](./mvp-1.0.0.md). Decisões estruturais têm ADR própria em [`adr/`](./adr/).

## Stack

- **Aplicação**: Next.js (App Router), deploy na Vercel.
- **Banco**: PostgreSQL via Supabase.
- **Auth (profissional)**: Supabase Auth (e-mail + senha, recuperação nativa).
- **E-mail transacional** (notificação de novo agendamento/cancelamento): Resend.
- **Hospedagem**: Vercel, plano **Hobby** — projeto de estudo, sem cobrança real; ver nota abaixo.
- **Domínio**: `beautly.cloud`, nameservers apontados para a Vercel (`ns1`/`ns2.vercel-dns.com`) para habilitar wildcard subdomain com SSL automático (ver [ADR 0003](./adr/0003-wildcard-subdomains-vercel-nameservers.md)).

> **Nota sobre o plano Vercel**: o Hobby plan suporta wildcard domains tecnicamente em qualquer plano — a restrição de "uso não-comercial" do Hobby é uma questão de Termos de Serviço, não uma limitação técnica. Como este é um projeto de estudo (não será de fato comercializado, mesmo simulando um produto real), o Hobby é adequado. Se a intenção mudar para venda real no futuro, revisitar essa decisão antes de qualquer lançamento de verdade.

## Isolamento multi-tenant

Schema único, toda tabela com `tenant_id`, isolamento aplicado via Row Level Security do Postgres. Ver [ADR 0001](./adr/0001-rls-multi-tenant-isolation.md).

- Políticas RLS na tabela de tenant/profissional: uma linha só é legível/editável pelo próprio `auth.uid()` dono dela.
- Políticas RLS em `services`, `working_hours`, `blocked_days`, `appointments`: leitura/escrita restrita ao `tenant_id` que pertence ao usuário autenticado (via join implícito com a tabela de tenant).
- Escrita pública (criação/cancelamento de agendamento pela cliente, sem sessão) roda em Server Actions/rotas que usam a **service role key** do Supabase (que ignora RLS) — a segurança dessas rotas vem da própria lógica da rota, não de RLS: elas só operam sobre o `tenant_id` resolvido pelo subdomínio da requisição, nunca aceitam `tenant_id` vindo do client.

## Roteamento por subdomínio

Segue o padrão documentado pela própria Vercel para plataformas multi-tenant (["Multi-tenant Platforms Quickstart"](https://vercel.com/docs/platforms/multi-tenant-platforms/quickstart)):

1. O arquivo que intercepta a requisição lê o header `Host`.
2. Extrai o subdomínio (ex: `ana` de `ana.beautly.cloud`).
3. Reescreve a rota internamente para uma rota dinâmica (ex: `/tenant/[subdomain]/...`), sem expor isso na URL visível. `painel.beautly.cloud` e o domínio apex passam sem rewrite (ver seção própria abaixo).
4. A página resolve o tenant a partir do subdomínio (consulta cacheada — subdomínio é praticamente estático por tenant).
5. Se o subdomínio não existir ou o tenant estiver inativo: renderiza a página de "indisponível" (ver regra multi-tenant no `CONTEXT.md`).

> **Atenção, versão do Next.js**: a partir do Next.js 16, o arquivo `middleware.ts` foi **renomeado pra `proxy.ts`** (mesma função, export renomeado de `middleware` pra `proxy`). Isso é o tipo de mudança que quebra qualquer tutorial/exemplo antigo copiado da internet — confirmar a versão instalada antes de escrever esse arquivo.

## Concorrência na criação de agendamento

Garantida no banco, não na aplicação: `EXCLUDE USING gist` sobre `(tenant_id, tsrange(start_time, end_time)) WHERE status = 'confirmed'`, com a extensão `btree_gist`. Ver [ADR 0002](./adr/0002-exclusion-constraint-no-overlap.md). A aplicação apenas tenta o `INSERT`; se o banco rejeitar por violação da constraint, a rota traduz isso no erro de negócio já definido ("esse horário acabou de ser reservado, escolha outro").

## Link único de agendamento

Token gerado de forma aleatória e não sequencial (`gen_random_uuid()`, nativo do Postgres) em coluna própria, distinto do id interno da linha — evita que alguém adivinhe ou itere sobre agendamentos de outras clientes.

## Fuso horário na geração de disponibilidade (pegadinha real)

`America/Sao_Paulo` é UTC-3. Um "dia" local (00:00–23:59 em Sao Paulo) **não** coincide com meia-noite UTC — começa às 03:00 UTC e vai até 03:00 UTC do dia seguinte. Qualquer query que filtre agendamentos "do dia X" usando limites `X 00:00:00Z` / `X 23:59:59Z` (meia-noite UTC) vai incluir/excluir agendamentos errados perto da virada do dia. Os limites do dia precisam ser calculados convertendo a meia-noite **local** pro instante UTC correspondente (ex: com `date-fns-tz`), não construídos como string UTC ingênua.

## Admin do painel: qual subdomínio serve o quê

`painel.beautly.cloud` é um subdomínio reservado (ver `schema.sql`), compartilhado por todas as profissionais — não existe um painel por tenant-subdomínio. Login e páginas autenticadas resolvem "de qual tenant é essa profissional" via `auth.uid()` (que é o próprio id do tenant, ver seção de isolamento acima), não via subdomínio da requisição. Isso evita ter que replicar sessão de auth por subdomínio.

A página de login **não pode viver dentro do layout que guarda a sessão** (o layout redireciona pra `/login` quando não há sessão; se `/login` estiver dentro do mesmo grupo guardado, vira loop de redirecionamento). `login/page.tsx` fica fora do route group `(painel)`.

## Notificação

Server Action/rota que cria ou cancela um agendamento dispara, de forma síncrona ou via fire-and-forget, uma chamada à API do Resend enviando o e-mail para o endereço cadastrado da profissional daquele tenant.

## Schema físico

DDL completo (tabelas, constraints e policies de RLS) em [`schema.sql`](./schema.sql).

Pontos que só fazem sentido lendo o schema junto com o raciocínio:

- `tenants.id` **é** o `auth.users.id` — não existe join nenhum pra saber "essa linha pertence a qual usuário logado", é comparação direta (`auth.uid() = tenant_id`). Isso é reflexo direto de termos conflado Tenant e Profissional numa única entidade.
- `appointments` não tem nenhuma policy de acesso público (nem leitura, nem escrita). Isso é deliberado: se a cliente pudesse ler agendamentos diretamente via RLS pra calcular disponibilidade, ela enxergaria nome/telefone de outras clientes do mesmo tenant. Criação e cancelamento pela cliente (sem sessão) e o cálculo de disponibilidade passam por rotas server-side usando a **service role key** (que ignora RLS), retornando só o que é seguro expor (horários livres, status do próprio agendamento pelo token) — nunca linhas cruas de outras clientes.
- `working_hours` e `blocked_days` têm policy pública de leitura porque não carregam nenhum dado sensível — só a agenda em si.

## Estrutura de pastas (Next.js App Router)

```
beautly/
├── app/
│   ├── (public)/
│   │   └── tenant/
│   │       └── [subdomain]/             # alvo do rewrite do proxy — namespace isolado do apex/painel
│   │           ├── page.tsx             # negócio + serviços + seleção de data/horário
│   │           ├── actions.ts           # server actions: disponibilidade + criar agendamento (service role key)
│   │           └── agendamento/
│   │               └── [token]/
│   │                   ├── page.tsx     # ver detalhes + cancelar
│   │                   └── actions.ts   # server action: cancelar (valida token, service role key)
│   │
│   ├── login/page.tsx                   # FORA do grupo (painel): evita loop de redirect
│   ├── (painel)/
│   │   ├── layout.tsx                   # guarda de sessão (Supabase Auth) — só envolve as rotas abaixo
│   │   ├── agendamentos/page.tsx        # lista cronológica
│   │   ├── servicos/page.tsx            # CRUD de serviços
│   │   ├── horarios/page.tsx            # expediente por dia da semana + bloqueio de dias
│   │   └── configuracoes/page.tsx       # nome, logo, telefone, endereço, descrição
│   │
│   ├── indisponivel/page.tsx            # tenant não existe ou está inativo
│   └── page.tsx                         # apex (beautly.cloud) — stub, sem landing page de marketing
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                    # client autenticado (cookies do painel)
│   │   ├── client.ts                    # client de browser (login)
│   │   └── service-role.ts              # client com service role key (rotas públicas)
│   ├── availability.ts                  # cálculo da grade de horários disponíveis (cuidado com fuso — ver acima)
│   ├── tenants.ts                       # resolve tenant público por subdomínio
│   ├── phone.ts                         # validação de telefone brasileiro
│   └── email.ts                         # chamada à API do Resend
│
├── proxy.ts                              # lê Host, resolve subdomínio, rewrite pra (public)/tenant/[subdomain]
├── docs/                                 # este diretório
└── supabase/
    └── migrations/                       # schema.sql versionado como migrations reais
```

## Em aberto para a próxima etapa

- Scaffolding real do projeto (`create-next-app`, instalação de dependências, projeto Supabase de fato criado) e implementação do código acima — feito sob demanda, ainda não executado.
