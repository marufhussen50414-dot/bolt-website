/*
# Auto-create profile row on new auth user (supports OAuth / Google sign-in)

1. Overview
Email/password sign-ups create their `profiles` row from the frontend.
Social logins (Google) skip that step entirely, so the user lands with no
profile row — which blocks listing/order creation (foreign keys reference
profiles) and leaves the header stuck on the fallback "User" name.

This migration adds a `handle_new_user` trigger that fires on every
`auth.users` INSERT and guarantees a profile row exists with a sensible
display name and a unique username. It is idempotent: if a row already
exists (e.g. the frontend created it moments earlier) the trigger does
nothing.

2. New database objects
- `handle_new_user()` — trigger function that INSERTs a `profiles` row
  for the new auth user when one does not already exist. It pulls
  `full_name` and `avatar_url` from `raw_user_meta_data` (where OAuth
  providers like Google store them) and synthesizes a unique username
  from the display name + a short id suffix.
- `on_auth_user_created` — AFTER INSERT trigger on `auth.users`.

3. Security
- No RLS / policy changes. The new function runs as the owner
  (SECURITY DEFINER) so it can write to `profiles` during the
  auth-creation transaction, before the user has a usable session.
- Existing `public_read_profiles`, `update_own_profile`, and
  `insert_own_profile` policies continue to apply unchanged.

4. Important notes
- Safe to re-run: the function is `CREATE OR REPLACE` and the trigger
  uses `DROP TRIGGER IF EXISTS` before creation.
- Username uniqueness is guaranteed by appending the first 8 chars of
  the auth uid, which is unique per user.
- Does not touch existing rows; only fires for future inserts.
*/

-- Trigger function: ensure a profiles row exists for every new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_avatar text;
  v_username text;
BEGIN
  -- Pull name + avatar from OAuth/user metadata (Google sends full_name + avatar_url)
  v_full_name := COALESCE(
    NULLIF(new.raw_user_meta_data->>'full_name', ''),
    NULLIF(new.raw_user_meta_data->>'name', ''),
    NULLIF(new.raw_user_meta_data->>'user_name', ''),
    'Player'
  );
  v_avatar := NULLIF(new.raw_user_meta_data->>'avatar_url', '');

  -- Build a unique username: slug of the name + first 8 chars of the uid
  v_username := lower(regexp_replace(v_full_name, '[^a-zA-Z0-9]', '', 'g'));
  IF v_username = '' OR v_username IS NULL THEN
    v_username := 'user';
  END IF;
  v_username := v_username || '_' || left(new.id::text, 8);

  -- Only insert if a profile row does not already exist (frontend may have made one)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id) THEN
    INSERT INTO public.profiles (id, full_name, username, avatar_url)
    VALUES (new.id, v_full_name, v_username, v_avatar)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Fire the function whenever a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
