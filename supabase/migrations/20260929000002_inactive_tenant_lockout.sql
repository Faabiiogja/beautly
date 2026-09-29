-- Tenant inativo bloqueia tudo, também no banco (não só na UI): quem tem um JWT válido não consegue
-- gravar nada chamando a API direto. A dona ainda lê a própria linha em `tenants` para o app
-- conseguir distinguir "sem acesso" de "não logada".

-- tenants: leitura da própria linha sempre; escrita só se ativa e só nas colunas de perfil
drop policy "tenant owner full access" on tenants;

create policy "tenant owner reads own row"
  on tenants for select
  to authenticated
  using (auth.uid() = id);

create policy "active tenant owner updates own profile"
  on tenants for update
  to authenticated
  using (auth.uid() = id and active)
  with check (auth.uid() = id and active);

revoke update on tenants from authenticated;
grant update (business_name, logo_url, phone, address, description) on tenants to authenticated;

-- demais tabelas: a dona só acessa se o tenant estiver ativo
drop policy "tenant owner manages own services" on services;
create policy "active tenant owner manages own services"
  on services for all
  to authenticated
  using (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active))
  with check (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active));

drop policy "tenant owner manages own working_hours" on working_hours;
create policy "active tenant owner manages own working_hours"
  on working_hours for all
  to authenticated
  using (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active))
  with check (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active));

drop policy "tenant owner manages own blocked_days" on blocked_days;
create policy "active tenant owner manages own blocked_days"
  on blocked_days for all
  to authenticated
  using (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active))
  with check (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active));

drop policy "tenant owner manages own appointments" on appointments;
create policy "active tenant owner manages own appointments"
  on appointments for all
  to authenticated
  using (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active))
  with check (auth.uid() = tenant_id and exists (select 1 from tenants t where t.id = tenant_id and t.active));
