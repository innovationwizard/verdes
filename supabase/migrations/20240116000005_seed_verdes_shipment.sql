-- ============================================================
-- SEED: Verdes sheet shipment from Verdes.xlsx
-- MIG 16/01/2024 — 233 qq × Q8,000/qq, TC 7.75
-- 1 × 20ft container, 7 grades allocated (10,400 kg)
-- ============================================================

DO $$
DECLARE
  v_shipment_id UUID;
  v_container_id UUID;
  v_p1_id UUID;
  v_p2_id UUID;
  v_p3_id UUID;
  v_s1_id UUID;
  v_s2_id UUID;
  v_gop_id UUID;
  v_yellow_id UUID;
  v_myq_id UUID;
  v_trip_id UUID;
  v_oro_id UUID;
BEGIN
  -- Get quality grade IDs
  SELECT id INTO v_p1_id FROM quality_grades WHERE code = 'P1';
  SELECT id INTO v_p2_id FROM quality_grades WHERE code = 'P2';
  SELECT id INTO v_p3_id FROM quality_grades WHERE code = 'P3';
  SELECT id INTO v_s1_id FROM quality_grades WHERE code = 'S1_7MM';
  SELECT id INTO v_s2_id FROM quality_grades WHERE code = 'S2_5_6MM';
  SELECT id INTO v_gop_id FROM quality_grades WHERE code = 'GOP';
  SELECT id INTO v_yellow_id FROM quality_grades WHERE code = 'YELLOW';
  SELECT id INTO v_myq_id FROM quality_grades WHERE code = 'MYQ';
  SELECT id INTO v_trip_id FROM quality_grades WHERE code = 'TRIP';
  SELECT id INTO v_oro_id FROM quality_grades WHERE code = 'ORO';

  -- Create shipment
  INSERT INTO shipments (
    reference_code, label, date, status,
    quantity_qq, price_per_qq_gtq, bag_weight_kg, exchange_rate,
    merma_pct, interest_rate_annual, financing_months, isr_pct, admin_fixed_usd
  ) VALUES (
    'MIG-2024-001',
    'Embarque Verdes — Enero 2024',
    '2024-01-16',
    'complete',
    233,
    8000,
    46,
    7.75,
    0.03,
    0.0975,
    1.5,
    0.25,
    500
  ) RETURNING id INTO v_shipment_id;

  -- Create 20ft container
  INSERT INTO containers (shipment_id, size, sequence_number, capacity_kg)
  VALUES (v_shipment_id, '20ft', 1, 10000)
  RETURNING id INTO v_container_id;

  -- Allocations from Verdes sheet (F column = kilos, G column = sale price $/kg)
  -- P1: 2,600 kg @ $33.00/kg
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_p1_id, 2600, 33);

  -- P2: 1,800 kg @ $38.50/kg
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_p2_id, 1800, 38.5);

  -- P3: 1,600 kg @ $36.00/kg
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_p3_id, 1600, 36);

  -- S1 +7mm: 1,000 kg @ $38.00/kg
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_s1_id, 1000, 38);

  -- S2 5-6mm: 1,000 kg @ $32.75/kg
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_s2_id, 1000, 32.75);

  -- GOP: 900 kg @ $29.25/kg
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_gop_id, 900, 29.25);

  -- YELLOW: 0 kg @ $29.25/kg (no allocation this shipment)
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_yellow_id, 0, 29.25);

  -- MYQ: 0 kg @ $24.50/kg (no allocation this shipment)
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_myq_id, 0, 24.5);

  -- TRIP: 1,500 kg @ $28.00/kg
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_trip_id, 1500, 28);

  -- ORO: 0 kg @ $29.00/kg (no allocation this shipment)
  INSERT INTO container_allocations (container_id, quality_grade_id, kilos, sale_price_usd_kg)
  VALUES (v_container_id, v_oro_id, 0, 29);

  -- Snapshot costs from current cost_prices
  INSERT INTO shipment_costs (shipment_id, cost_item_id, amount, currency, unit)
  SELECT
    v_shipment_id,
    cp.cost_item_id,
    cp.amount,
    cp.currency,
    cp.unit
  FROM cost_prices cp
  INNER JOIN (
    SELECT cost_item_id, MAX(effective_at) AS max_effective
    FROM cost_prices
    GROUP BY cost_item_id
  ) latest ON cp.cost_item_id = latest.cost_item_id AND cp.effective_at = latest.max_effective
  INNER JOIN cost_items ci ON ci.id = cp.cost_item_id
  WHERE ci.is_active = true;

  RAISE NOTICE 'Created shipment MIG-2024-001 (id: %)', v_shipment_id;
  RAISE NOTICE 'Container id: %', v_container_id;
  RAISE NOTICE 'Total allocated: 10,400 kg across 10 quality grades';
END $$;
