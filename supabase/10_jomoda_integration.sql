-- ═══════════════════════════════════════════════════════════════════════════
-- MAKANJOM — Jomoda integration
-- Adds jomoda_slug column so a restaurant listing can link to its Jomoda store.
-- Safe to run multiple times (IF NOT EXISTS / idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS jomoda_slug TEXT;

COMMENT ON COLUMN restaurants.jomoda_slug IS
  'Jomoda vendor slug (e.g. "pelita-nasi-kandar"). When set, the Makanjom restaurant page shows an Order Online button pointing to https://jomoda.my/{jomoda_slug}.';
