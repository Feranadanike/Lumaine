/*
  # Interconnected Intelligence System

  ## Overview
  This migration adds correlation tracking and pattern detection capabilities to discover relationships between user activities.

  ## New Tables

  ### 1. `activity_correlations`
  Stores discovered correlations between different activity types
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `activity_a` (text) - First activity type (e.g., 'workout')
  - `activity_b` (text) - Second activity type (e.g., 'mood')
  - `correlation_score` (numeric) - Correlation strength (-1 to 1)
  - `confidence` (numeric) - Statistical confidence (0 to 1)
  - `sample_size` (integer) - Number of data points analyzed
  - `insight_text` (text) - Human-readable insight
  - `positive_direction` (boolean) - Whether correlation is beneficial
  - `last_calculated` (timestamptz) - When correlation was last computed
  - `created_at` (timestamptz)

  ### 2. `user_patterns`
  Stores detected patterns and trends in user behavior
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `pattern_type` (text) - Type: streak, decline, improvement, cycle
  - `activity_type` (text) - Which activity (workout, mood, skincare, etc.)
  - `pattern_data` (jsonb) - Pattern details and metrics
  - `strength` (numeric) - Pattern strength (0 to 1)
  - `insight_text` (text) - Human-readable pattern description
  - `detected_at` (timestamptz) - When pattern was detected
  - `is_active` (boolean) - Whether pattern is still relevant
  - `created_at` (timestamptz)

  ### 3. `smart_insights`
  Auto-generated insights surfaced to users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `insight_type` (text) - correlation, pattern, prediction, recommendation
  - `category` (text) - wellness, productivity, finance, lifestyle
  - `title` (text) - Insight headline
  - `description` (text) - Detailed explanation
  - `data_points` (jsonb) - Supporting data
  - `action_suggestions` (jsonb) - Recommended actions
  - `priority` (integer) - Display priority (1-5)
  - `is_dismissed` (boolean) - Whether user dismissed it
  - `generated_at` (timestamptz)
  - `expires_at` (timestamptz) - When insight becomes stale
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own correlations, patterns, and insights

  ## Indexes
  - Optimize queries for correlation lookups
  - Index pattern detection by activity type
  - Index insights by category and priority
*/

-- Create activity_correlations table
CREATE TABLE IF NOT EXISTS activity_correlations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_a text NOT NULL,
  activity_b text NOT NULL,
  correlation_score numeric NOT NULL CHECK (correlation_score >= -1 AND correlation_score <= 1),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  sample_size integer NOT NULL DEFAULT 0,
  insight_text text NOT NULL,
  positive_direction boolean DEFAULT true,
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, activity_a, activity_b)
);

-- Create user_patterns table
CREATE TABLE IF NOT EXISTS user_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('streak', 'decline', 'improvement', 'cycle', 'anomaly')),
  activity_type text NOT NULL,
  pattern_data jsonb DEFAULT '{}'::jsonb,
  strength numeric NOT NULL CHECK (strength >= 0 AND strength <= 1),
  insight_text text NOT NULL,
  detected_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create smart_insights table
CREATE TABLE IF NOT EXISTS smart_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('correlation', 'pattern', 'prediction', 'recommendation')),
  category text NOT NULL CHECK (category IN ('wellness', 'productivity', 'finance', 'lifestyle')),
  title text NOT NULL,
  description text NOT NULL,
  data_points jsonb DEFAULT '{}'::jsonb,
  action_suggestions jsonb DEFAULT '[]'::jsonb,
  priority integer DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  is_dismissed boolean DEFAULT false,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_correlations
CREATE POLICY "Users can view own correlations"
  ON activity_correlations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own correlations"
  ON activity_correlations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own correlations"
  ON activity_correlations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own correlations"
  ON activity_correlations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_patterns
CREATE POLICY "Users can view own patterns"
  ON user_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
  ON user_patterns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON user_patterns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns"
  ON user_patterns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for smart_insights
CREATE POLICY "Users can view own insights"
  ON smart_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON smart_insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON smart_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON smart_insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_correlations_user_id ON activity_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_correlations_activities ON activity_correlations(user_id, activity_a, activity_b);
CREATE INDEX IF NOT EXISTS idx_correlations_score ON activity_correlations(user_id, correlation_score DESC);

CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_activity ON user_patterns(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON user_patterns(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_insights_user_id ON smart_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_category ON smart_insights(user_id, category);
CREATE INDEX IF NOT EXISTS idx_insights_priority ON smart_insights(user_id, priority DESC) WHERE is_dismissed = false;
CREATE INDEX IF NOT EXISTS idx_insights_active ON smart_insights(user_id, is_dismissed) WHERE is_dismissed = false;