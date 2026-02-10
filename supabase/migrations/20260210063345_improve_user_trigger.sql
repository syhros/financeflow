/*
  # Improve User Registration Trigger

  1. Improvements
    - Remove INSERT policy that was causing RLS conflicts
    - Keep only the essential SELECT and UPDATE policies
    - Ensure trigger has proper error handling
    - Trigger will be the only path to create user profiles
*/

-- Drop the INSERT policy that was causing conflicts
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- Drop and recreate trigger to ensure it's correct
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name),
    username = COALESCE(EXCLUDED.username, users.username);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
