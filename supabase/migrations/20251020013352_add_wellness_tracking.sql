/*
  # Add Wellness Tracking Tables

  1. New Tables
    - `meditation_sessions` - Track meditation practice
    - `sleep_logs` - Track sleep patterns
    - `water_intake` - Track daily hydration

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- Meditation Sessions
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes integer NOT NULL,
  meditation_type text,
  notes text,
  mood_before integer,
  mood_after integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meditation sessions"
  ON meditation_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions"
  ON meditation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions"
  ON meditation_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meditation sessions"
  ON meditation_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sleep Logs
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sleep_date date NOT NULL,
  bedtime time,
  wake_time time,
  hours_slept numeric,
  quality_rating integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sleep_date)
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep logs"
  ON sleep_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep logs"
  ON sleep_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep logs"
  ON sleep_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep logs"
  ON sleep_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Water Intake
CREATE TABLE IF NOT EXISTS water_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  intake_date date NOT NULL DEFAULT CURRENT_DATE,
  glasses_count integer DEFAULT 0,
  ounces_total numeric DEFAULT 0,
  goal_glasses integer DEFAULT 8,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, intake_date)
);

ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water intake"
  ON water_intake FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water intake"
  ON water_intake FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water intake"
  ON water_intake FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water intake"
  ON water_intake FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);