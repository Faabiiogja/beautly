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

## E2E / Playwright

Testes de navegador (`tests/e2e/`) rodam contra `next dev` de verdade, então precisam de um Supabase **de verdade** por trás — nunca o de produção. Use um segundo projeto Supabase (staging), plano gratuito.

> Se este repo tiver um `.mcp.json` do Supabase configurado, ele aponta pro projeto de **produção** — as ferramentas MCP do Supabase não servem pra mexer no staging. Use sempre os scripts `npm run e2e:*` abaixo, que se conectam no staging via `.env.e2e.local`.

1. Crie o projeto de staging no [supabase.com](https://supabase.com/dashboard).
2. Em **Project Settings → API**, pegue a Project URL, a `anon` key e a `service_role` key.
3. Em **Project Settings → Database → Connection string → Session pooler** (não o "Transaction pooler" — esse usa a porta 6543, e `scripts/e2e-migrate.sh` fixa a porta 5432 do Session pooler), pegue `host`, `user` e a senha do banco — a conexão direta (`db.<ref>.supabase.co`) só existe em IPv6 e não funciona em toda rede/CI, por isso usamos o pooler (IPv4).
4. Crie `.env.e2e.local` na raiz (já está no `.gitignore`, nunca vai pro git):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>
   SUPABASE_DB_PASSWORD=<senha do banco>
   SUPABASE_DB_POOLER_HOST=aws-0-<região>.pooler.supabase.com
   SUPABASE_DB_POOLER_USER=postgres.<ref>
   ```

5. `npm run e2e:migrate` — aplica `supabase/migrations/` no staging (idempotente: só roda se `public.tenants` ainda não existir).
6. `npm run e2e:seed` — cria/atualiza o tenant fixo `e2e` (serviços, expediente, login) usado pelos specs. Idempotente, rode de novo sempre que quiser resetar o estado.
7. `npm run test:e2e` — sobe o `next dev` na porta 3100 apontado pro staging (via `playwright.config.ts`) e roda a suíte em desktop e celular.

Recriar o estado do tenant `e2e` entre execuções: rode `npm run e2e:seed` de novo (ele apaga e recria serviços/expediente/agendamentos do tenant, sem tocar em outros tenants do staging).
