/*
  # Add Goals System

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `category` (text) - fitness, skincare, wellness, financial, hobby
      - `title` (text) - Short goal title
      - `description` (text) - Detailed description
      - `target_value` (numeric) - Optional target number
      - `current_value` (numeric) - Current progress
      - `target_date` (date) - Optional deadline
      - `status` (text) - active, completed, paused
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `goals` table
    - Add policies for authenticated users to manage their own goals
*/

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  target_value numeric,
  current_value numeric DEFAULT 0,
  target_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);