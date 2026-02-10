/*
  # Fix User Registration and Transaction Types

  1. User Profile Creation
    - Add INSERT policy to users table to allow authenticated users to create their profile
    - Create trigger to auto-insert user profile when auth user is created
    - Uses email from auth.users and provides defaults for name/username

  2. Transaction Types
    - Update transactions table CHECK constraint to include 'debtpayment' type
    - Previously only allowed 'income', 'expense', 'investing'
    - Now also allows 'debtpayment' for debt payment transactions

  3. Security
    - Trigger runs with security definer to bypass RLS restrictions
    - Ensures profile creation succeeds regardless of client-side issues
    - Maintains data integrity
*/

-- Add INSERT policy for users table (allows auth users to create their own profile)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Users can create own profile'
  ) THEN
    CREATE POLICY "Users can create own profile"
      ON public.users FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create function to auto-insert user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update transactions table to allow debtpayment type
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions 
  ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('income', 'expense', 'investing', 'debtpayment'));
