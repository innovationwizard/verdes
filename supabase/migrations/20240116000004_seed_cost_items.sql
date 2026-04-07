-- ============================================================
-- SEED: Cost Items + Initial Prices
-- Values from Verdes.xlsx Anexos
-- ============================================================

-- Helper: insert cost item and its initial price
-- We'll use CTEs for clarity

-- ============================================================
-- ANEXO 1: Gastos de Compra (purchasing, per_qq, GTQ)
-- All currently zero but structure must exist
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('purchasing', 'Flete Interno', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_qq', 'Precio inicial' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('purchasing', 'Carga/Descarga', 2) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_qq', 'Precio inicial - incluido en maquila' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('purchasing', 'Costo seguro', 3) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_qq', 'Precio inicial' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('purchasing', 'Patrulla custodio', 4) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_qq', 'Precio inicial' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('purchasing', 'Sacos', 5) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_qq', 'Precio inicial' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('purchasing', 'Bolsa', 6) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_qq', 'Precio inicial' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('purchasing', 'Comisión Compra', 7) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_qq', 'Precio inicial - no hay comprador' FROM item;

-- ============================================================
-- ANEXO 2: Maquila (maquila, per_qq, GTQ)
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('maquila', 'Maquila', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 170, 'GTQ', 'per_qq', 'Q170 por quintal' FROM item;

-- ============================================================
-- ANEXO 3 FIJO: Exportación fijo 20' (export_fixed_20, flat, GTQ)
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Banco Industrial', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 271.25, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Banco BAM SWIFT', 2) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 155, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Certificado de Origen', 3) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 123.3025, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Fitosanitario', 4) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 49.6775, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Fumigación', 5) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 1309.285, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Certificado Peso/Calidad', 6) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 1743.75, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Agente Aduanal', 7) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 591.8675, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'DHL muestra', 8) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 1162.50, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Deprex', 9) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 99.975, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Logística', 10) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 3875, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Custodio puerto', 11) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 643.25, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'Flete Puerto', 12) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 10075, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_20', 'MSC Naviera', 13) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 27512.50, 'GTQ', 'flat', NULL FROM item;

-- ============================================================
-- ANEXO 3 VARIABLE: Exportación variable 20' (export_var_20, per_kg, GTQ)
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Cajas Master', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.5559075, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Caja Inner', 2) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.80050525, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Fleje', 3) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0266, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Grapa Fleje', 4) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0023, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Grapa caja', 5) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0440, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Bolsas negras', 6) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.1263, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Stickers', 7) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_kg', 'A pedido del cliente' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Sellos 5kg', 8) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0207, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_20', 'Sellos 40kg', 9) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0561, 'GTQ', 'per_kg', NULL FROM item;

-- ============================================================
-- ANEXO 4 FIJO: Exportación fijo 40' (export_fixed_40, flat, GTQ)
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Banco Industrial', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 271.25, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Banco BAM SWIFT', 2) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 155, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Certificado de Origen', 3) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 123.3025, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Fitosanitario', 4) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 49.6775, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Fumigación', 5) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 1309.285, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Certificado Peso/Calidad', 6) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 1743.75, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Agente Aduanal', 7) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 591.8675, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'DHL muestra', 8) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 1162.50, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'Logística', 9) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 3875, 'GTQ', 'flat', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_fixed_40', 'MSC Naviera', 10) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 38258.04, 'GTQ', 'flat', NULL FROM item;

-- ============================================================
-- ANEXO 4 VARIABLE: Exportación variable 40' (export_var_40, per_kg, GTQ)
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Cajas Master', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.4834, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Caja Inner', 2) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.6961, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Fleje', 3) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0232, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Grapa Fleje', 4) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0020, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Grapa caja', 5) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0382, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Bolsas negras', 6) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.1098, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Stickers', 7) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'GTQ', 'per_kg', 'A pedido del cliente' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Sellos 5kg', 8) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0180, 'GTQ', 'per_kg', NULL FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('export_var_40', 'Sellos 40kg', 9) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0488, 'GTQ', 'per_kg', NULL FROM item;

-- ============================================================
-- ANEXO 5: Costo Variable s/Factura (invoice_variable, pct_invoice, USD)
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('invoice_variable', 'Seguro de Carga', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0025, 'USD', 'pct_invoice', '0.25%' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('invoice_variable', 'Banco BAM', 2) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.0015, 'USD', 'pct_invoice', '0.15%' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('invoice_variable', 'BAM Cobranza', 3) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.005, 'USD', 'pct_invoice', '0.50%' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('invoice_variable', 'Comisión Venta', 4) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0, 'USD', 'pct_invoice', 'Actualmente 0%' FROM item;

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('invoice_variable', 'Agente', 5) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 0.02, 'USD', 'pct_invoice', '2%' FROM item;

-- ============================================================
-- ANEXO 6: Gastos Fijos (admin_fixed, flat, USD)
-- ============================================================

WITH item AS (
  INSERT INTO cost_items (category, name, sort_order) VALUES
    ('admin_fixed', 'TCG Finanzas', 1) RETURNING id
)
INSERT INTO cost_prices (cost_item_id, amount, currency, unit, notes)
  SELECT id, 500, 'USD', 'flat', 'Fee mensual por contabilidad y análisis financieros' FROM item;
