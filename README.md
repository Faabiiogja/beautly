# Beautly

SaaS de agendamento para profissionais autônomas de estética. Spec em [`docs/mvp-1.0.0.md`](docs/mvp-1.0.0.md), arquitetura em [`docs/architecture.md`](docs/architecture.md).

## Desenvolvimento

```bash
npm install
cp .env.example .env.local   # preencher com as chaves do projeto Supabase
npm run dev
```

- `npm test` — testes de banco (RLS e não sobreposição de agendamentos). Sobe um Postgres descartável via `initdb`/`pg_ctl` (precisa dos binários do PostgreSQL no sistema; não usa seu banco nem o Supabase).
- `npm run typecheck`, `npm run lint`, `npm run build`.
- O schema vive em `supabase/migrations/`; aplique todas, em ordem, no projeto Supabase (SQL Editor ou MCP; não há `supabase/config.toml` ainda). A segunda migration define os grants por role: o projeto não pode depender dos default privileges do Supabase.
