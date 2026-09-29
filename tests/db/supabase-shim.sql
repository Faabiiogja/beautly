-- Emula o mínimo do Supabase que o schema assume (roles, auth.users, auth.uid()),
-- para rodar as migrations num Postgres puro nos testes.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

create function auth.uid() returns uuid
  language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth to anon, authenticated, service_role;
-- Sem default privileges de propósito: os grants reais vêm das migrations (como no projeto Supabase).
