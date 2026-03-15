-- supabase/migrations/20260314000001_initial_schema.sql

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  logo_url      text,
  primary_color text NOT NULL DEFAULT '#ec4899',
  timezone      text NOT NULL DEFAULT 'America/Sao_Paulo',
  monthly_price numeric(10,2) NOT NULL DEFAULT 0,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TENANT USERS (admins vinculados ao Supabase Auth)
-- ============================================================
CREATE TABLE tenant_users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'owner'
             CHECK (role IN ('owner', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- ============================================================
-- PROFESSIONALS
-- ============================================================
CREATE TABLE professionals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  bio        text,
  avatar_url text,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- SERVICES
-- ============================================================
CREATE TABLE services (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text,
  price            numeric(10,2) NOT NULL DEFAULT 0,
  duration_minutes int NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes   int NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           text NOT NULL,
  phone          text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  anonymized_at  timestamptz,
  UNIQUE (tenant_id, phone)
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     uuid NOT NULL REFERENCES customers(id),
  service_id      uuid NOT NULL REFERENCES services(id),
  professional_id uuid NOT NULL REFERENCES professionals(id),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  status          text NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BOOKING TOKENS (links seguros para o cliente)
-- ============================================================
CREATE TABLE booking_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- BUSINESS HOURS (grade semanal do tenant)
-- ============================================================
CREATE TABLE business_hours (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week  int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_open      boolean NOT NULL DEFAULT true,
  open_time    time,
  close_time   time,
  UNIQUE (tenant_id, day_of_week),
  CHECK (
    (is_open = false) OR
    (is_open = true AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
  )
);

-- ============================================================
-- SCHEDULE BLOCKS (exceções / bloqueios)
-- ============================================================
CREATE TABLE schedule_blocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES professionals(id), -- NULL = bloqueia todos
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  reason          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);

-- ============================================================
-- updated_at automático via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
