/*
# Add Prime level and special tags to game listings

1. Purpose
   Supports new Sell-form requirements: a Free-Fire-only "Prime" field (0-8)
   and a flexible set of seller-defined highlight tags (Prime level, Level,
   Evo Max count, etc.) shown as pills on cards and the detail page.

2. New columns on `game_listings`
   - `prime` (integer, nullable): Free Fire Prime level, constrained 0-8.
     NULL for non-Free-Fire listings (Prime only applies to Free Fire).
   - `tags` (text[], nullable): free-form seller highlight tags stored as
     an array of short strings, e.g. {"Prime 5","Level 75","Evo Max 3"}.

3. Constraints
   - CHECK on `prime` ensuring value is between 0 and 8 when not NULL.

4. Security
   - No RLS policy changes. Existing read/insert/update/delete policies on
     `game_listings` already scope by seller_id / status, and the new
     columns are ordinary data columns covered by those policies.

5. Notes
   - `rank_tier` column is intentionally left in place to preserve existing
     data; the frontend simply stops collecting or displaying it. No data
     is dropped or altered.
   - Idempotent: uses IF NOT EXISTS for both columns and drops the CHECK
     constraint before re-creating it.
*/

ALTER TABLE public.game_listings
  ADD COLUMN IF NOT EXISTS prime integer;

ALTER TABLE public.game_listings
  ADD COLUMN IF NOT EXISTS tags text[];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_listings_prime_range'
  ) THEN
    ALTER TABLE public.game_listings
      ADD CONSTRAINT game_listings_prime_range
      CHECK (prime IS NULL OR (prime >= 0 AND prime <= 8));
  END IF;
END $$;
