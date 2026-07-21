/*
# Add prime column to game_listings

1. Changes
- Add `prime` column (int, nullable) to `game_listings`.
- Stores the "Prime" level (0-8) for Free Fire accounts, as entered in the Sell form.
- CHECK constraint ensures prime is between 0 and 8 when a value is set.
2. Security
- No RLS or policy changes. Existing game_listings policies remain unchanged.
3. Important Notes
- Column is nullable so existing listings and non-Free-Fire games are unaffected.
- Idempotent: guarded with DO $$ ... IF NOT EXISTS ... END $$ blocks so it is safe to re-run.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'game_listings' AND column_name = 'prime') THEN
    ALTER TABLE game_listings ADD COLUMN prime int;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'game_listings_prime_check') THEN
    ALTER TABLE game_listings ADD CONSTRAINT game_listings_prime_check CHECK (prime IS NULL OR (prime >= 0 AND prime <= 8));
  END IF;
END $$;
