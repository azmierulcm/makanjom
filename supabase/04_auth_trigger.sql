-- Run this in Supabase Dashboard → SQL Editor
-- Adds the missing handle_new_user trigger and profile RLS policies.

-- ─── Auto-create profile on signup ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _role TEXT;        -- TEXT in DECLARE so we never fail before BEGIN
  _full_name TEXT;
BEGIN
  -- Validate role; default to 'customer' for anything unexpected
  _role := NEW.raw_user_meta_data->>'role';
  IF _role IS NULL OR _role NOT IN ('customer', 'vendor', 'admin', 'creator') THEN
    _role := 'customer';
  END IF;
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Cast to user_role inside BEGIN so the EXCEPTION block can catch it
  -- if the type or table doesn't exist yet
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, _role::user_role, _full_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup due to profile creation errors
  RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Profile RLS: users can manage their own row ──────────────────────────────

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ─── Backfill: create profiles for demo accounts that already exist ───────────
-- (safe to run multiple times — ON CONFLICT DO NOTHING)

INSERT INTO public.profiles (id, role, full_name)
SELECT
  u.id,
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'customer'),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

SELECT 'Auth trigger and profile backfill complete' AS status;
