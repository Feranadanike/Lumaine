/*
  # Fix user_profiles RLS policies

  1. Changes
    - Add WITH CHECK to INSERT policy
    - Ensure users can create their own profile
*/

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);