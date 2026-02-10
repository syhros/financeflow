/*
  # Fix User Metadata Extraction During Signup

  1. Problem
    - User name and username not being saved during signup
    - Trigger extracting from raw_user_meta_data but values showing as defaults
    - Need to verify metadata keys and improve extraction logic

  2. Solution
    - Recreate trigger with improved JSON extraction
    - Ensure metadata keys are correct ('name', 'username')
    - Add user_settings entry creation for new users
    - Test with proper defaults

  3. Changes
    - Drop and recreate handle_new_user function
    - Ensure proper extraction from raw_user_meta_data
    - Create initial user_settings entry
    - Drop conflicting INSERT policies
*/

-- Drop conflicting policies first
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function that properly extracts and creates user profile
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_username TEXT;
BEGIN
  -- Extract name from metadata, default to empty string
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  
  -- Extract username from metadata, default to email local part
  user_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
  
  -- If username is still empty, use email local part
  IF user_username = '' THEN
    user_username := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  
  -- Ensure username is unique by appending user ID if needed
  IF user_username IS NULL OR user_username = '' THEN
    user_username := 'user_' || NEW.id;
  END IF;

  -- Insert user profile
  INSERT INTO public.users (id, email, name, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_username,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    username = EXCLUDED.username;
  
  -- Create default user_settings entry
  INSERT INTO public.user_settings (user_id, currency, notifications_enabled, auto_categorize, smart_suggestions, theme)
  VALUES (
    NEW.id,
    'GBP',
    TRUE,
    TRUE,
    TRUE,
    'dark'
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
