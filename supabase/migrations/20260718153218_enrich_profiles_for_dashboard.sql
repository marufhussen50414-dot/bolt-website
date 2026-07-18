/*
# Enrich profiles for a richer profile/dashboard experience

1. Overview
The marketplace is moving from a username-only identity to a richer profile.
Users now sign up with a "name" (display name) instead of a username. The old
`username` column stays for backward compatibility but is no longer the primary
identity shown in the UI.

2. Modified table: profiles
- `username` → now nullable (was NOT NULL). Kept for backward compatibility.
- `full_name` → now NOT NULL with a sane default, so it is the primary display name.
  Existing rows backfilled from `username` if `full_name` was empty.
- `avatar_url` (already existed) — used for profile picture.
- `bio` (already existed) — short bio shown on profile.
- NEW `location text` — optional location (e.g. "Dhaka, Bangladesh").
- NEW `discord text` — optional Discord handle for gaming contact.
- NEW `whatsapp text` — optional WhatsApp number for direct contact.
- NEW `preferred_payment text` — preferred payment method (bkash/nagad/card).
- NEW `bkash_number text`, `nagad_number text` — payout/contact numbers.
- NEW `is_online boolean DEFAULT false` — presence flag for online status dot.
- NEW `last_seen timestamptz DEFAULT now()` — last activity timestamp.
- NEW `response_rate int DEFAULT 0` — percentage of orders responded to on time.
- NEW `total_earnings numeric DEFAULT 0` — lifetime earnings (seller side).
- NEW `items_sold int DEFAULT 0` — alias mirroring total_sales for display.

3. Security
- RLS already enabled. No policy changes needed — existing
  public_read_profiles / update_own_profile / insert_own_profile policies
  continue to apply. New columns inherit the same row-level scoping.

4. Important notes
- All column additions are additive — no data is dropped or rewritten beyond
  the one-time backfill of `full_name` from `username` for existing rows.
- Safe to re-run: every ALTER uses IF NOT EXISTS guards via a DO block.
- `username` UNIQUE constraint is retained; new sign-ups may leave it NULL.
*/

-- Make username nullable (was NOT NULL) so name-based sign-ups work
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;

-- Promote full_name to NOT NULL with a default so it becomes the display name
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'full_name'
                   AND is_nullable = 'NO') THEN
    -- Backfill any empty full_name from username before making NOT NULL
    UPDATE profiles SET full_name = username WHERE full_name IS NULL OR full_name = '';
    ALTER TABLE profiles ALTER COLUMN full_name SET NOT NULL;
  END IF;
END $$;

ALTER TABLE profiles ALTER COLUMN full_name SET DEFAULT 'Player';

-- Add new optional profile columns (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'discord') THEN
    ALTER TABLE profiles ADD COLUMN discord text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'whatsapp') THEN
    ALTER TABLE profiles ADD COLUMN whatsapp text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'preferred_payment') THEN
    ALTER TABLE profiles ADD COLUMN preferred_payment text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'bkash_number') THEN
    ALTER TABLE profiles ADD COLUMN bkash_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'nagad_number') THEN
    ALTER TABLE profiles ADD COLUMN nagad_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'is_online') THEN
    ALTER TABLE profiles ADD COLUMN is_online boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
    ALTER TABLE profiles ADD COLUMN last_seen timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'response_rate') THEN
    ALTER TABLE profiles ADD COLUMN response_rate int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'total_earnings') THEN
    ALTER TABLE profiles ADD COLUMN total_earnings numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'profiles' AND column_name = 'items_sold') THEN
    ALTER TABLE profiles ADD COLUMN items_sold int DEFAULT 0;
  END IF;
END $$;

-- Index last_seen for online-presence queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online);
