-- ═══════════════════════════════════════════════════════════════════════════
-- MAKANJOM — Update price_range labels to human-readable format
-- Old: 'RM' / 'RM RM' / 'RM RM RM' / 'RM RM RM RM'
-- New: '< RM 10' / 'RM 10–20' / 'RM 20–50' / 'RM 50+'
-- Safe to re-run (UPDATE WHERE is idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE restaurants SET price_range = '< RM 10'   WHERE price_range = 'RM';
UPDATE restaurants SET price_range = 'RM 10–20'  WHERE price_range = 'RM RM';
UPDATE restaurants SET price_range = 'RM 20–50'  WHERE price_range = 'RM RM RM';
UPDATE restaurants SET price_range = 'RM 50+'    WHERE price_range = 'RM RM RM RM';
