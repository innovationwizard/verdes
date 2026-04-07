-- ============================================================
-- SEED: Quality Grades
-- Cardamom quality classifications in three tiers
-- ============================================================

INSERT INTO quality_grades (code, display_name, tier, sort_order) VALUES
  ('P1',       'P1',         'top',    1),
  ('P2',       'P2',         'top',    2),
  ('P3',       'P3',         'top',    3),
  ('S1_7MM',   'S1 +7mm',    'medium', 4),
  ('S2_5_6MM', 'S2 5-6mm',   'medium', 5),
  ('GOP',      'GOP',        'low',    6),
  ('YELLOW',   'YELLOW (LG)','low',    7),
  ('MYQ',      'MYQ',        'low',    8),
  ('TRIP',     'TRIP',       'low',    9),
  ('ORO',      'ORO',        'low',   10);
