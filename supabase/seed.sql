-- supabase/seed.sql
-- Dados de desenvolvimento — carregados via `supabase db reset`

DO $$
DECLARE
  demo_tenant_id uuid := gen_random_uuid();
  demo_professional_id uuid := gen_random_uuid();
BEGIN

-- ============================================================
-- Tenant demo
-- ============================================================
INSERT INTO tenants (id, slug, name, primary_color, timezone, monthly_price, status)
VALUES (
  demo_tenant_id,
  'demo',
  'Studio Demo',
  '#ec4899',
  'America/Sao_Paulo',
  99.90,
  'active'
);

-- ============================================================
-- Profissional padrão (criado automaticamente com o tenant)
-- ============================================================
INSERT INTO professionals (id, tenant_id, name, is_active, sort_order)
VALUES (
  demo_professional_id,
  demo_tenant_id,
  'Ana Silva',
  true,
  0
);

-- ============================================================
-- Serviços de exemplo
-- ============================================================
INSERT INTO services (tenant_id, name, description, price, duration_minutes, buffer_minutes, is_active)
VALUES
  (demo_tenant_id, 'Manicure', 'Manicure completa com esmaltação', 45.00, 45, 15, true),
  (demo_tenant_id, 'Pedicure', 'Pedicure completa com esmaltação', 55.00, 60, 15, true),
  (demo_tenant_id, 'Design de Sobrancelha', 'Design e limpeza de sobrancelha', 60.00, 30, 10, true),
  (demo_tenant_id, 'Limpeza de Pele', 'Limpeza profunda de pele', 120.00, 90, 15, true),
  (demo_tenant_id, 'Alongamento de Unhas', 'Alongamento em gel ou fibra', 150.00, 120, 15, false);

-- ============================================================
-- Horários de funcionamento (seg-sáb)
-- ============================================================
INSERT INTO business_hours (tenant_id, day_of_week, is_open, open_time, close_time)
VALUES
  (demo_tenant_id, 0, false, null, null),          -- Domingo: fechado
  (demo_tenant_id, 1, true, '09:00', '19:00'),     -- Segunda
  (demo_tenant_id, 2, true, '09:00', '19:00'),     -- Terça
  (demo_tenant_id, 3, true, '09:00', '19:00'),     -- Quarta
  (demo_tenant_id, 4, true, '09:00', '19:00'),     -- Quinta
  (demo_tenant_id, 5, true, '09:00', '18:00'),     -- Sexta
  (demo_tenant_id, 6, true, '09:00', '14:00');     -- Sábado: meio período

END $$;
