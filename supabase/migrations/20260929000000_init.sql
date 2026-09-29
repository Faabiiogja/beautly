-- Beautly 1.0.0 — schema inicial (Supabase / Postgres)
-- Ver docs/architecture.md e docs/adr/ para o raciocínio por trás de cada decisão.

create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";

-- ============================================================
-- tenants (Tenant + Profissional conflados — ADR-se não há entidade separada)
-- id = auth.users.id: 1 login = 1 tenant, sempre.
-- ============================================================
create table tenants (
  id uuid primary key references auth.users (id) on delete cascade,
  subdomain text not null unique,
  business_name text not null,
  logo_url text,
  phone text not null,
  address text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint subdomain_format check (
    subdomain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'
  ),
  constraint subdomain_not_reserved check (
    subdomain not in (
      'www', 'app', 'api', 'admin', 'beautly', 'mail', 'ftp',
      'static', 'cdn', 'docs', 'help', 'support', 'blog', 'painel'
    )
  )
);

alter table tenants enable row level security;

-- a profissional só enxerga/edita a própria linha
create policy "tenant owner full access"
  on tenants for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- página pública: qualquer visitante pode ler dados de um tenant ativo
-- (todos os campos aqui já são, por natureza, informação pública do negócio)
create policy "public can read active tenants"
  on tenants for select
  to anon
  using (active = true);


-- ============================================================
-- services
-- ============================================================
create table services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),

  -- alvo da FK composta de appointments: garante que o serviço é do mesmo tenant
  unique (tenant_id, id)
);

alter table services enable row level security;

create policy "tenant owner manages own services"
  on services for all
  using (auth.uid() = tenant_id)
  with check (auth.uid() = tenant_id);

create policy "public can read active services of active tenants"
  on services for select
  to anon
  using (
    active = true
    and exists (
      select 1 from tenants t
      where t.id = services.tenant_id and t.active = true
    )
  );


-- ============================================================
-- working_hours — uma linha por dia da semana por tenant
-- weekday segue a convenção do Postgres: 0 = domingo ... 6 = sábado
-- ============================================================
create table working_hours (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  closed boolean not null default false,
  start_time time,
  end_time time,
  created_at timestamptz not null default now(),

  unique (tenant_id, weekday),
  constraint hours_set_unless_closed check (
    closed = true or (start_time is not null and end_time is not null and start_time < end_time)
  )
);

alter table working_hours enable row level security;

create policy "tenant owner manages own working_hours"
  on working_hours for all
  using (auth.uid() = tenant_id)
  with check (auth.uid() = tenant_id);

create policy "public can read working_hours of active tenants"
  on working_hours for select
  to anon
  using (
    exists (
      select 1 from tenants t
      where t.id = working_hours.tenant_id and t.active = true
    )
  );


-- ============================================================
-- blocked_days — sempre dia inteiro
-- ============================================================
create table blocked_days (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),

  unique (tenant_id, day)
);

alter table blocked_days enable row level security;

create policy "tenant owner manages own blocked_days"
  on blocked_days for all
  using (auth.uid() = tenant_id)
  with check (auth.uid() = tenant_id);

create policy "public can read blocked_days of active tenants"
  on blocked_days for select
  to anon
  using (
    exists (
      select 1 from tenants t
      where t.id = blocked_days.tenant_id and t.active = true
    )
  );


-- ============================================================
-- appointments
-- Sem policy de leitura/escrita pública: criação e cancelamento pela
-- cliente passam por rotas server-side com a service role key (ver
-- docs/architecture.md) — nunca direto do client anônimo.
-- ============================================================
create table appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  service_id uuid not null,

  -- snapshot do serviço no momento da criação (ver regra de negócio em CONTEXT.md)
  service_name_snapshot text not null,
  price_cents_snapshot integer not null,
  duration_minutes_snapshot integer not null,

  client_name text not null,
  client_phone text not null,

  start_time timestamptz not null,
  end_time timestamptz not null,

  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),

  -- token do link único de agendamento — não sequencial, não adivinhável
  token uuid not null unique default gen_random_uuid(),

  created_at timestamptz not null default now(),
  cancelled_at timestamptz,

  constraint end_after_start check (end_time > start_time),

  -- um agendamento só pode apontar para serviço do próprio tenant
  constraint appointment_service_same_tenant
    foreign key (tenant_id, service_id) references services (tenant_id, id) on delete restrict,

  -- ADR 0002: nunca dois agendamentos confirmados sobrepostos no mesmo tenant
  exclude using gist (
    tenant_id with =,
    tstzrange(start_time, end_time) with &&
  ) where (status = 'confirmed')
);

alter table appointments enable row level security;

create policy "tenant owner manages own appointments"
  on appointments for all
  using (auth.uid() = tenant_id)
  with check (auth.uid() = tenant_id);

-- nenhuma policy pública: leitura/escrita anônima acontece só via
-- service role key em rotas server-side, nunca direto pelo client.
