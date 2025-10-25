/*
  # Add Study Notes with Categories

  1. New Tables
    - `study_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `content` (text) - The note content
      - `category` (text) - Subject/topic category (e.g., "Math", "History")
      - `color` (text) - Color code for the category (e.g., "blue", "green", "purple")
      - `position` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on study_notes table
    - Add policies for authenticated users to manage their own notes

  3. Important Notes
    - Each note has a category with an associated color for visual organization
    - Notes can be filtered by category for focused studying
    - Color-coded tags make it easy to identify subjects at a glance
*/

-- Create study_notes table
CREATE TABLE IF NOT EXISTS study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  color text NOT NULL DEFAULT 'blue',
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;

-- Policies for study_notes
CREATE POLICY "Users can view own study notes"
  ON study_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study notes"
  ON study_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study notes"
  ON study_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study notes"
  ON study_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
