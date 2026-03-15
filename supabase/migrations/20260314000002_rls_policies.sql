-- supabase/migrations/20260314000002_rls_policies.sql

-- ============================================================
-- Ativar RLS em todas as tabelas de tenant
-- ============================================================
ALTER TABLE tenant_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_tokens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours   ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Políticas para usuários autenticados (tenant admin)
-- Usam auth.uid() — chave anon/user, NÃO service_role
-- ============================================================

-- tenant_users: admin vê apenas seu próprio tenant
CREATE POLICY tu_tenant_isolation ON tenant_users
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- professionals
CREATE POLICY prof_tenant_isolation ON professionals
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- services
CREATE POLICY svc_tenant_isolation ON services
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- customers
CREATE POLICY cust_tenant_isolation ON customers
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- bookings
CREATE POLICY book_tenant_isolation ON bookings
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- booking_tokens (acesso via booking → tenant)
CREATE POLICY bt_tenant_isolation ON booking_tokens
  FOR ALL USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN tenant_users tu ON b.tenant_id = tu.tenant_id
      WHERE tu.user_id = auth.uid()
    )
  );

-- business_hours
CREATE POLICY bh_tenant_isolation ON business_hours
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- schedule_blocks
CREATE POLICY sb_tenant_isolation ON schedule_blocks
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- NOTA: O fluxo público de booking e o super admin usam
-- service_role key — RLS é bypassado intencionalmente.
-- O isolamento nesse caso é garantido pelo tenant_id
-- explícito em todas as queries da aplicação.
-- Nunca expor a service_role key no client-side.
-- ============================================================
