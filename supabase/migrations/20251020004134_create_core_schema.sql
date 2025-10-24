/*
  # AI Journal & Planner App - Core Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - links to auth.users
      - `display_name` (text)
      - `skin_type` (text) - for skincare AI
      - `skin_concerns` (text[]) - array of concerns
      - `fitness_goals` (text) - gym goals description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `skincare_products`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `brand` (text)
      - `type` (text) - cleanser, moisturizer, serum, etc.
      - `active_ingredients` (text[])
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `skincare_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `log_date` (date)
      - `time_of_day` (text) - AM or PM
      - `products_used` (uuid[]) - array of product IDs
      - `skin_condition_rating` (int) - 1-5 scale
      - `photo_url` (text) - optional
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `workout_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `workout_date` (date)
      - `workout_name` (text)
      - `exercises` (jsonb) - array of {name, sets, reps, weight, notes}
      - `duration_minutes` (int)
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `savings_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `goal_name` (text)
      - `target_amount` (decimal)
      - `current_amount` (decimal)
      - `target_date` (date)
      - `is_completed` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `savings_transactions`
      - `id` (uuid, primary key)
      - `goal_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `amount` (decimal)
      - `transaction_type` (text) - deposit or withdrawal
      - `transaction_date` (date)
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `journal_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `entry_date` (date)
      - `title` (text)
      - `content` (text)
      - `mood_score` (int) - 1-5 scale
      - `mood_tags` (text[]) - calm, stressed, happy, motivated, etc.
      - `gratitude_items` (text[])
      - `ai_detected_mood` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `daily_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `achievement_date` (date)
      - `win_description` (text)
      - `category` (text) - skincare, gym, savings, hobby, personal, etc.
      - `created_at` (timestamptz)
    
    - `weekly_reflections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `week_start_date` (date)
      - `highlights` (text[])
      - `reflection` (text)
      - `ai_summary` (text)
      - `created_at` (timestamptz)
    
    - `hobbies`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `hobby_name` (text)
      - `hobby_type` (text) - reading, bible_study, meditation, etc.
      - `frequency_goal` (text) - daily, weekly, monthly
      - `target_count` (int) - sessions per period
      - `is_active` (boolean)
      - `created_at` (timestamptz)
    
    - `hobby_logs`
      - `id` (uuid, primary key)
      - `hobby_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `log_date` (date)
      - `duration_minutes` (int)
      - `notes` (text)
      - `progress_details` (jsonb) - e.g., {book_page: 45, chapter: 3}
      - `created_at` (timestamptz)
    
    - `daily_planner`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `plan_date` (date)
      - `tasks` (jsonb) - array of {id, title, time_slot, completed, category}
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `weekly_planner`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `week_start_date` (date)
      - `goals` (text[])
      - `tasks` (jsonb)
      - `review_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `monthly_planner`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `month_date` (date)
      - `milestones` (text[])
      - `budget_plan` (jsonb)
      - `habit_overview` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `yearly_goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `year` (int)
      - `vision_board` (text[])
      - `major_goals` (jsonb)
      - `reflection_prompts` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `reminder_type` (text) - skincare, workout, savings, journal, hobby
      - `reminder_time` (time)
      - `frequency` (text) - daily, weekly, custom
      - `days_of_week` (int[]) - 0-6 for Sunday-Saturday
      - `is_active` (boolean)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
*/

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  skin_type text,
  skin_concerns text[],
  fitness_goals text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Skincare Products
CREATE TABLE IF NOT EXISTS skincare_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  type text NOT NULL,
  active_ingredients text[],
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skincare_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON skincare_products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON skincare_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON skincare_products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON skincare_products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Skincare Logs
CREATE TABLE IF NOT EXISTS skincare_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  time_of_day text NOT NULL CHECK (time_of_day IN ('AM', 'PM')),
  products_used uuid[],
  skin_condition_rating int CHECK (skin_condition_rating >= 1 AND skin_condition_rating <= 5),
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skincare_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skincare logs"
  ON skincare_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare logs"
  ON skincare_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare logs"
  ON skincare_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare logs"
  ON skincare_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_date date NOT NULL DEFAULT CURRENT_DATE,
  workout_name text NOT NULL,
  exercises jsonb DEFAULT '[]'::jsonb,
  duration_minutes int,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
  ON workout_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts"
  ON workout_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts"
  ON workout_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts"
  ON workout_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Savings Goals
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name text NOT NULL,
  target_amount decimal(10,2) NOT NULL,
  current_amount decimal(10,2) DEFAULT 0,
  target_date date,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings goals"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Savings Transactions
CREATE TABLE IF NOT EXISTS savings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON savings_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON savings_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON savings_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON savings_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  content text NOT NULL,
  mood_score int CHECK (mood_score >= 1 AND mood_score <= 5),
  mood_tags text[],
  gratitude_items text[],
  ai_detected_mood text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily Achievements
CREATE TABLE IF NOT EXISTS daily_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_date date NOT NULL DEFAULT CURRENT_DATE,
  win_description text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON daily_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON daily_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON daily_achievements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements"
  ON daily_achievements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Weekly Reflections
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  highlights text[],
  reflection text,
  ai_summary text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reflections"
  ON weekly_reflections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections"
  ON weekly_reflections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections"
  ON weekly_reflections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reflections"
  ON weekly_reflections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hobbies
CREATE TABLE IF NOT EXISTS hobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hobby_name text NOT NULL,
  hobby_type text NOT NULL,
  frequency_goal text NOT NULL,
  target_count int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hobbies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hobbies"
  ON hobbies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hobbies"
  ON hobbies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hobbies"
  ON hobbies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hobbies"
  ON hobbies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hobby Logs
CREATE TABLE IF NOT EXISTS hobby_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hobby_id uuid NOT NULL REFERENCES hobbies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes int,
  notes text,
  progress_details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hobby_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hobby logs"
  ON hobby_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hobby logs"
  ON hobby_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hobby logs"
  ON hobby_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hobby logs"
  ON hobby_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily Planner
CREATE TABLE IF NOT EXISTS daily_planner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date date NOT NULL DEFAULT CURRENT_DATE,
  tasks jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_date)
);

ALTER TABLE daily_planner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily plans"
  ON daily_planner FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily plans"
  ON daily_planner FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily plans"
  ON daily_planner FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily plans"
  ON daily_planner FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Weekly Planner
CREATE TABLE IF NOT EXISTS weekly_planner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  goals text[],
  tasks jsonb DEFAULT '[]'::jsonb,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

ALTER TABLE weekly_planner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly plans"
  ON weekly_planner FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly plans"
  ON weekly_planner FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly plans"
  ON weekly_planner FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly plans"
  ON weekly_planner FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Monthly Planner
CREATE TABLE IF NOT EXISTS monthly_planner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_date date NOT NULL,
  milestones text[],
  budget_plan jsonb,
  habit_overview jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month_date)
);

ALTER TABLE monthly_planner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monthly plans"
  ON monthly_planner FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monthly plans"
  ON monthly_planner FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monthly plans"
  ON monthly_planner FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own monthly plans"
  ON monthly_planner FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Yearly Goals
CREATE TABLE IF NOT EXISTS yearly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  vision_board text[],
  major_goals jsonb,
  reflection_prompts text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

ALTER TABLE yearly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own yearly goals"
  ON yearly_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own yearly goals"
  ON yearly_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own yearly goals"
  ON yearly_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own yearly goals"
  ON yearly_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,
  reminder_time time NOT NULL,
  frequency text NOT NULL,
  days_of_week int[],
  is_active boolean DEFAULT true,
  message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_skincare_logs_user_date ON skincare_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_hobby_logs_user_date ON hobby_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_planner_user_date ON daily_planner(user_id, plan_date DESC);