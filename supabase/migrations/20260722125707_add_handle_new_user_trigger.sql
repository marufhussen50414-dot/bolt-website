/*
# Auto-create profile on signup

1. Context
- The real application has a `profiles` table (id -> auth.users.id, full_name, username, etc.)
  referenced by `game_listings.seller_id`.
- There is currently NO database trigger to auto-create a profile when a new auth user signs up.
  The existing app creates the profile row from the frontend after signUp().
- This migration adds a SECURITY DEFINER function + trigger so a profile row is always created
  on signup, using the full_name from raw_user_meta_data if present, otherwise 'Player'.
2. New objects
- Function `public.handle_new_user()` — inserts a profile row for NEW auth users.
- Trigger `on_auth_user_created` on `auth.users` AFTER INSERT.
3. Safety
- Read-only on auth.users; only inserts into public.profiles.
- Idempotent: function is CREATE OR REPLACE; trigger uses DROP IF EXISTS first.
- No existing data is modified or deleted.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Player')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
