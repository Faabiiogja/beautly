-- supabase/migrations/20260314000003_indexes.sql

-- Performance: agenda do dia (query mais frequente)
CREATE INDEX idx_bookings_tenant_date
  ON bookings(tenant_id, starts_at);

-- Performance: agenda por profissional
CREATE INDEX idx_bookings_professional_date
  ON bookings(tenant_id, professional_id, starts_at);

-- Performance: filtro por status
CREATE INDEX idx_bookings_tenant_status
  ON bookings(tenant_id, status);

-- Performance: lookup de cliente por telefone
CREATE INDEX idx_customers_phone
  ON customers(tenant_id, phone);

-- Performance crítica: validação de token (path mais frequente do cliente)
CREATE UNIQUE INDEX idx_booking_tokens_token
  ON booking_tokens(token);

-- Performance: profissionais ativos do tenant
CREATE INDEX idx_professionals_active
  ON professionals(tenant_id, is_active);

-- Performance: bloqueios de agenda por período
CREATE INDEX idx_schedule_blocks_period
  ON schedule_blocks(tenant_id, start_at, end_at);

-- Performance: serviços ativos do tenant
CREATE INDEX idx_services_active
  ON services(tenant_id, is_active);

-- Performance crítica: resolução de tenant por slug
CREATE INDEX idx_tenants_slug
  ON tenants(slug);

-- Performance: filtro de tenants ativos (super admin)
CREATE INDEX idx_tenants_status
  ON tenants(status);

-- ============================================================
-- CONSTRAINT: previne double-booking
-- Dois agendamentos confirmados no mesmo horário para o
-- mesmo profissional são rejeitados pelo banco.
-- ============================================================
CREATE UNIQUE INDEX idx_no_double_booking
  ON bookings(professional_id, starts_at)
  WHERE status NOT IN ('cancelled', 'rescheduled');
