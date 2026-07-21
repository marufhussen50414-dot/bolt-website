/*
# Add evo_max_count column to game_listings

1. Changes
- Add `evo_max_count` column (int, nullable) to `game_listings`.
- Stores the count of maxed-out Evo items (guns/characters) for Free Fire accounts,
  as entered in the Sell form. Displayed as a highlight tag on listing cards and detail views.
2. Security
- No RLS or policy changes. Existing game_listings policies remain unchanged.
3. Important Notes
- Column is nullable so existing listings and non-Free-Fire games are unaffected.
- Idempotent: guarded with DO $$ ... IF NOT EXISTS ... END $$ so it is safe to re-run.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_listings' AND column_name = 'evo_max_count') THEN
    ALTER TABLE game_listings ADD COLUMN evo_max_count int;
  END IF;
END $$;
