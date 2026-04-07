-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_allocations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- All authenticated users can read everything
-- ============================================================

CREATE POLICY "authenticated_read" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON quality_grades
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON cost_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON cost_prices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON shipments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON shipment_costs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON containers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_read" ON container_allocations
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Master + Operator: write shipments, containers, allocations, shipment_costs
-- ============================================================

CREATE POLICY "operator_write" ON shipments
  FOR ALL TO authenticated
  USING (get_user_role() IN ('master', 'operator'))
  WITH CHECK (get_user_role() IN ('master', 'operator'));

CREATE POLICY "operator_write" ON shipment_costs
  FOR ALL TO authenticated
  USING (get_user_role() IN ('master', 'operator'))
  WITH CHECK (get_user_role() IN ('master', 'operator'));

CREATE POLICY "operator_write" ON containers
  FOR ALL TO authenticated
  USING (get_user_role() IN ('master', 'operator'))
  WITH CHECK (get_user_role() IN ('master', 'operator'));

CREATE POLICY "operator_write" ON container_allocations
  FOR ALL TO authenticated
  USING (get_user_role() IN ('master', 'operator'))
  WITH CHECK (get_user_role() IN ('master', 'operator'));

-- ============================================================
-- Master only: write cost_items, cost_prices, quality_grades, user_profiles
-- ============================================================

CREATE POLICY "master_write" ON cost_items
  FOR ALL TO authenticated
  USING (get_user_role() = 'master')
  WITH CHECK (get_user_role() = 'master');

CREATE POLICY "master_write" ON cost_prices
  FOR ALL TO authenticated
  USING (get_user_role() = 'master')
  WITH CHECK (get_user_role() = 'master');

CREATE POLICY "master_write" ON quality_grades
  FOR ALL TO authenticated
  USING (get_user_role() = 'master')
  WITH CHECK (get_user_role() = 'master');

CREATE POLICY "master_write" ON user_profiles
  FOR ALL TO authenticated
  USING (get_user_role() = 'master')
  WITH CHECK (get_user_role() = 'master');
