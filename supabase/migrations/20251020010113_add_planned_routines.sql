/*
  # Add Planned Routines and Schedules

  1. New Tables
    - `planned_workouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `day_of_week` (int) - 0-6 for Sunday-Saturday
      - `workout_name` (text)
      - `exercises` (jsonb) - planned exercises
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `planned_skincare_routines`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `time_of_day` (text) - AM or PM
      - `products` (uuid[]) - array of product IDs
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users to access only their own data
*/

-- Planned Workouts
CREATE TABLE IF NOT EXISTS planned_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  workout_name text NOT NULL,
  exercises jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_of_week)
);

ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planned workouts"
  ON planned_workouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planned workouts"
  ON planned_workouts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planned workouts"
  ON planned_workouts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned workouts"
  ON planned_workouts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Planned Skincare Routines
CREATE TABLE IF NOT EXISTS planned_skincare_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_of_day text NOT NULL CHECK (time_of_day IN ('AM', 'PM')),
  products uuid[],
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, time_of_day)
);

ALTER TABLE planned_skincare_routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planned routines"
  ON planned_skincare_routines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planned routines"
  ON planned_skincare_routines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planned routines"
  ON planned_skincare_routines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned routines"
  ON planned_skincare_routines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);