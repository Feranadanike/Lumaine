/*
  # Add Study Space Preferences

  1. New Tables
    - `study_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `quick_notes` (text) - Quick notepad content for study sessions
      - `background_style` (text) - Selected background theme/gradient
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `study_preferences` table
    - Add policies for authenticated users to manage their own preferences
*/

CREATE TABLE IF NOT EXISTS study_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  quick_notes text DEFAULT '',
  background_style text DEFAULT 'gradient-purple',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study preferences"
  ON study_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study preferences"
  ON study_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study preferences"
  ON study_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study preferences"
  ON study_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_preferences_user_id ON study_preferences(user_id);
