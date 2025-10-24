/*
  # Add Gamification Columns to user_profiles

  1. Changes
    - Add gamification columns to existing user_profiles table
    - Create new achievement tables
    - Add daily activity tracking

  2. Security
    - Maintain existing RLS policies
    - Add policies for new tables
*/

-- Add gamification columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'total_xp') THEN
    ALTER TABLE user_profiles ADD COLUMN total_xp integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'level') THEN
    ALTER TABLE user_profiles ADD COLUMN level integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_streak') THEN
    ALTER TABLE user_profiles ADD COLUMN current_streak integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'longest_streak') THEN
    ALTER TABLE user_profiles ADD COLUMN longest_streak integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_activity_date') THEN
    ALTER TABLE user_profiles ADD COLUMN last_activity_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'theme') THEN
    ALTER TABLE user_profiles ADD COLUMN theme text DEFAULT 'default';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'notifications_enabled') THEN
    ALTER TABLE user_profiles ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'bio') THEN
    ALTER TABLE user_profiles ADD COLUMN bio text;
  END IF;
END $$;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  xp_reward integer DEFAULT 0,
  rarity text DEFAULT 'common',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own achievements" ON user_achievements;
CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create daily_activities table
CREATE TABLE IF NOT EXISTS daily_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  workout_logged boolean DEFAULT false,
  journal_logged boolean DEFAULT false,
  skincare_logged boolean DEFAULT false,
  hobby_logged boolean DEFAULT false,
  goals_checked boolean DEFAULT false,
  total_xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, activity_date)
);

ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activities" ON daily_activities;
CREATE POLICY "Users can view own activities"
  ON daily_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON daily_activities;
CREATE POLICY "Users can insert own activities"
  ON daily_activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON daily_activities;
CREATE POLICY "Users can update own activities"
  ON daily_activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Seed initial achievements
INSERT INTO achievements (code, name, description, icon, category, requirement_type, requirement_value, xp_reward, rarity) VALUES
  ('first_workout', 'First Steps', 'Complete your first workout', 'trophy', 'fitness', 'count', 1, 50, 'common'),
  ('workout_10', 'Gym Regular', 'Complete 10 workouts', 'dumbbell', 'fitness', 'count', 10, 100, 'common'),
  ('workout_50', 'Fitness Enthusiast', 'Complete 50 workouts', 'flame', 'fitness', 'count', 50, 250, 'rare'),
  ('workout_100', 'Fitness Legend', 'Complete 100 workouts', 'star', 'fitness', 'count', 100, 500, 'epic'),
  
  ('first_journal', 'Self Reflection', 'Write your first journal entry', 'book-open', 'wellness', 'count', 1, 50, 'common'),
  ('journal_30', 'Mindful Writer', 'Write 30 journal entries', 'pen-tool', 'wellness', 'count', 30, 150, 'common'),
  ('journal_100', 'Mind Master', 'Write 100 journal entries', 'brain', 'wellness', 'count', 100, 400, 'epic'),
  
  ('first_skincare', 'Glow Up', 'Log your first skincare routine', 'sparkles', 'skincare', 'count', 1, 50, 'common'),
  ('skincare_50', 'Skincare Devotee', 'Log 50 skincare routines', 'droplet', 'skincare', 'count', 50, 200, 'rare'),
  
  ('streak_3', 'Getting Started', '3 day streak', 'calendar', 'streak', 'streak', 3, 75, 'common'),
  ('streak_7', 'Week Warrior', '7 day streak', 'zap', 'streak', 'streak', 7, 150, 'common'),
  ('streak_30', 'Monthly Master', '30 day streak', 'award', 'streak', 'streak', 30, 500, 'rare'),
  ('streak_100', 'Century Streak', '100 day streak', 'crown', 'streak', 'streak', 100, 1500, 'legendary'),
  
  ('first_goal', 'Goal Setter', 'Create your first goal', 'target', 'goals', 'count', 1, 50, 'common'),
  ('goal_complete_1', 'Achiever', 'Complete your first goal', 'check-circle', 'goals', 'count', 1, 100, 'common'),
  ('goal_complete_5', 'Goal Crusher', 'Complete 5 goals', 'trophy', 'goals', 'count', 5, 300, 'rare'),
  
  ('level_5', 'Rising Star', 'Reach level 5', 'trending-up', 'level', 'level', 5, 100, 'common'),
  ('level_10', 'Power User', 'Reach level 10', 'zap', 'level', 'level', 10, 250, 'rare'),
  ('level_25', 'Elite Member', 'Reach level 25', 'star', 'level', 'level', 25, 750, 'epic'),
  ('level_50', 'MyLumiere Legend', 'Reach level 50', 'crown', 'level', 'level', 50, 2000, 'legendary')
ON CONFLICT (code) DO NOTHING;