-- ============================================================
-- MIG Export — Database Schema
-- Cardamom export P&L application
-- ============================================================

-- ENUMS
CREATE TYPE user_role AS ENUM ('master', 'operator', 'gerencia');
CREATE TYPE container_size AS ENUM ('20ft', '40ft');
CREATE TYPE shipment_status AS ENUM ('draft', 'in_progress', 'complete', 'cancelled');
CREATE TYPE cost_category_code AS ENUM (
  'purchasing',
  'maquila',
  'export_fixed_20',
  'export_var_20',
  'export_fixed_40',
  'export_var_40',
  'invoice_variable',
  'admin_fixed'
);
CREATE TYPE allocation_input_mode AS ENUM ('kilos', 'percentage');

-- ============================================================
-- USER PROFILES (linked to Supabase Auth)
-- ============================================================

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'gerencia',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- QUALITY GRADES
-- ============================================================

CREATE TABLE quality_grades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  tier          TEXT NOT NULL CHECK (tier IN ('top', 'medium', 'low')),
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- COST STRUCTURE
-- ============================================================

CREATE TABLE cost_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        cost_category_code NOT NULL,
  name            TEXT NOT NULL,
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cost_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_item_id    UUID NOT NULL REFERENCES cost_items(id),
  amount          NUMERIC(14,4) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL CHECK (currency IN ('GTQ', 'USD')),
  unit            TEXT NOT NULL CHECK (unit IN ('flat', 'per_qq', 'per_kg', 'pct_invoice')),
  notes           TEXT,
  recorded_by     UUID REFERENCES user_profiles(id),
  effective_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cost_prices_item_effective
  ON cost_prices(cost_item_id, effective_at DESC);

-- ============================================================
-- SHIPMENTS
-- ============================================================

CREATE TABLE shipments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code       TEXT NOT NULL UNIQUE,
  label                TEXT,
  date                 DATE NOT NULL DEFAULT CURRENT_DATE,
  status               shipment_status NOT NULL DEFAULT 'draft',

  -- Purchase inputs
  quantity_qq          NUMERIC(10,2) NOT NULL,
  price_per_qq_gtq     NUMERIC(12,2) NOT NULL,
  bag_weight_kg        NUMERIC(8,2) NOT NULL DEFAULT 46,
  exchange_rate        NUMERIC(8,4) NOT NULL,

  -- Parameters
  merma_pct            NUMERIC(5,4) NOT NULL DEFAULT 0.03,
  interest_rate_annual NUMERIC(5,4) NOT NULL DEFAULT 0.0975,
  financing_months     NUMERIC(4,1) NOT NULL DEFAULT 1.5,
  isr_pct              NUMERIC(5,4) NOT NULL DEFAULT 0.25,
  admin_fixed_usd      NUMERIC(12,2) NOT NULL DEFAULT 500,

  -- Clone tracking
  cloned_from_id       UUID REFERENCES shipments(id),

  created_by           UUID REFERENCES user_profiles(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SHIPMENT COSTS (snapshot at creation time)
-- ============================================================

CREATE TABLE shipment_costs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  cost_item_id    UUID NOT NULL REFERENCES cost_items(id),
  amount          NUMERIC(14,4) NOT NULL,
  currency        TEXT NOT NULL CHECK (currency IN ('GTQ', 'USD')),
  unit            TEXT NOT NULL CHECK (unit IN ('flat', 'per_qq', 'per_kg', 'pct_invoice')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, cost_item_id)
);

-- ============================================================
-- CONTAINERS
-- ============================================================

CREATE TABLE containers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  size            container_size NOT NULL DEFAULT '20ft',
  sequence_number INT NOT NULL DEFAULT 1,
  capacity_kg     NUMERIC(10,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, sequence_number)
);

-- ============================================================
-- CONTAINER ALLOCATIONS
-- ============================================================

CREATE TABLE container_allocations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id      UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  quality_grade_id  UUID NOT NULL REFERENCES quality_grades(id),
  input_mode        allocation_input_mode NOT NULL DEFAULT 'kilos',
  kilos             NUMERIC(10,2) NOT NULL DEFAULT 0,
  percentage        NUMERIC(6,4),
  sale_price_usd_kg NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(container_id, quality_grade_id)
);

-- ============================================================
-- REFERENCE CODE GENERATOR
-- ============================================================

CREATE OR REPLACE FUNCTION generate_reference_code()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_seq INT;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(reference_code, '-', 3) AS INT)
  ), 0) + 1
  INTO next_seq
  FROM shipments
  WHERE reference_code LIKE 'MIG-' || current_year || '-%';
  RETURN 'MIG-' || current_year || '-' || LPAD(next_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
