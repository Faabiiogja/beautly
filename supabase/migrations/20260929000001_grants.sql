-- Grants explícitos, mínimos, por role. O RLS continua sendo a barreira por linha; aqui se define
-- quais operações cada role pode sequer tentar. Não dependemos dos default privileges do Supabase.

grant usage on schema public to anon, authenticated, service_role;

-- visitante anônimo: só leitura das tabelas da página pública (nunca appointments)
grant select on tenants, services, working_hours, blocked_days to anon;

-- profissional logada: gerencia o que é dela. Tenants são criados/removidos só pelo founder (Studio).
grant select, update on tenants to authenticated;
grant select, insert, update, delete on services, working_hours, blocked_days, appointments to authenticated;

-- rotas server-side (service role key) ignoram RLS mas precisam de grants
grant select, insert, update, delete on tenants, services, working_hours, blocked_days, appointments to service_role;
