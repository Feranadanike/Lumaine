/*
  # Fix Mood Entries SELECT Policy for Updates

  1. Changes
    - Update SELECT policy to allow viewing entries even if deleted_at is set
    - This is needed because UPDATE operations require SELECT permission first
    - The application will still filter out deleted entries in the query

  2. Security
    - Users can only view their own entries
    - Maintains data isolation between users
*/

DROP POLICY IF EXISTS "Users can view own mood entries" ON mood_entries;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);