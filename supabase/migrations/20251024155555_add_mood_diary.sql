/*
  # Add Mood Diary System

  1. New Tables
    - `mood_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `entry_date` (date) - The date of the mood entry
      - `created_at` (timestamptz) - When the entry was created
      - `emotions` (text array) - Selected emotions (happy, sad, anxious, excited, stressed, calm, angry, etc.)
      - `context_factors` (text array) - What influenced the mood (family, friends, work, school, health, hobbies, finances, etc.)
      - `notes` (text) - Optional written reflection
      - `intensity` (int) - Mood intensity from 1-10
      - `deleted_at` (timestamptz) - Soft delete timestamp

  2. Security
    - Enable RLS on `mood_entries` table
    - Add policies for authenticated users to manage their own entries

  3. Indexes
    - Add index on user_id and entry_date for faster queries
*/

CREATE TABLE IF NOT EXISTS mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL,
  emotions text[] DEFAULT '{}' NOT NULL,
  context_factors text[] DEFAULT '{}' NOT NULL,
  notes text DEFAULT '',
  intensity int CHECK (intensity >= 1 AND intensity <= 10),
  deleted_at timestamptz
);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_mood_entries_deleted ON mood_entries(user_id, deleted_at) WHERE deleted_at IS NULL;

CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own mood entries"
  ON mood_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);