/*
  # Fix Mood Entries Delete Policy

  1. Changes
    - Drop conflicting UPDATE policies
    - Create a single UPDATE policy that allows both regular updates and soft deletes
  
  2. Security
    - Users can only update their own entries
    - Soft deletes are allowed by setting deleted_at
*/

DROP POLICY IF EXISTS "Users can update own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can soft delete own mood entries" ON mood_entries;

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);