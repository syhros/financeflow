/*
  # Fix User Registration RLS Policies

  1. Problem
    - User signup was failing due to RLS policy preventing user profile creation
    - Trigger was attempting INSERT but hitting RLS restrictions
  
  2. Solution
    - Add INSERT policy that allows authenticated users to insert their own profile
    - The trigger (SECURITY DEFINER) will handle the actual INSERT
    - Users can only create their own profile via the id check
  
  3. Security
    - Policy ensures users can only insert their own data (auth.uid() check)
    - Existing SELECT and UPDATE policies remain unchanged
*/

-- Add INSERT policy for users table to allow profile creation during signup
CREATE POLICY "Users can create own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
