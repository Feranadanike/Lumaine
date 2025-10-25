/*
  # Create Study Space Tables

  1. New Tables
    - `study_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `start_time` (timestamptz) - When study session started
      - `end_time` (timestamptz) - When study session ended
      - `duration_minutes` (integer) - Total study duration
      - `break_interval_minutes` (integer) - Break frequency chosen (30, 60, etc)
      - `sound_choice` (text) - Which ambient sound was used
      - `completed` (boolean) - Whether session was completed or abandoned
      - `created_at` (timestamptz)
    
    - `study_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references study_sessions)
      - `subject` (text) - What subject/topic was studied
      - `notes` (text) - Detailed notes about what was learned
      - `key_takeaways` (text) - Key points from the session
      - `mood_rating` (integer) - 1-5 rating of how the session felt
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own study data
    - Users can only read, create, update their own sessions and logs

  3. Important Notes
    - Study sessions track the timer and settings
    - Study logs capture what was learned after each session
    - Integration point for AI Coach to provide study insights
    - Duration tracking helps with analytics and progress monitoring
*/

-- Create study_sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer NOT NULL,
  break_interval_minutes integer NOT NULL DEFAULT 30,
  sound_choice text DEFAULT 'none',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create study_logs table
CREATE TABLE IF NOT EXISTS study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  notes text,
  key_takeaways text,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- Policies for study_sessions
CREATE POLICY "Users can view own study sessions"
  ON study_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study sessions"
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
  ON study_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for study_logs
CREATE POLICY "Users can view own study logs"
  ON study_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study logs"
  ON study_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study logs"
  ON study_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study logs"
  ON study_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);