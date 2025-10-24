/*
  # Automation & Workflows System

  ## Overview
  This migration adds comprehensive automation capabilities including routines, templates, and recurring tasks.

  ## New Tables
  
  ### 1. `routines`
  Stores user-created routines (morning, evening, custom workflows)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `name` (text) - Routine name
  - `type` (text) - morning/evening/custom
  - `description` (text) - Optional description
  - `icon` (text) - Lucide icon name
  - `color` (text) - Theme color
  - `enabled` (boolean) - Whether routine is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `routine_actions`
  Defines actions that execute when a routine runs
  - `id` (uuid, primary key)
  - `routine_id` (uuid, foreign key to routines)
  - `action_type` (text) - Type of action (create_planner_task, log_mood, create_workout, etc.)
  - `action_data` (jsonb) - Action configuration and parameters
  - `order` (integer) - Execution order
  - `created_at` (timestamptz)

  ### 3. `routine_templates`
  Pre-built routine templates users can adopt
  - `id` (uuid, primary key)
  - `name` (text) - Template name
  - `description` (text) - What the template does
  - `category` (text) - productivity/wellness/finance/lifestyle
  - `icon` (text) - Lucide icon name
  - `actions` (jsonb) - Array of action definitions
  - `is_premium` (boolean) - Whether template requires premium
  - `created_at` (timestamptz)

  ### 4. `recurring_tasks`
  Patterns for auto-generating recurring tasks
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `task_type` (text) - planner/workout/meal/bill/skincare/etc.
  - `task_data` (jsonb) - Task details and configuration
  - `recurrence_pattern` (text) - daily/weekly/monthly/custom
  - `recurrence_config` (jsonb) - Pattern details (days of week, dates, intervals)
  - `next_occurrence` (timestamptz) - When to generate next task
  - `last_generated` (timestamptz) - Last generation timestamp
  - `enabled` (boolean) - Whether recurrence is active
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own routines and recurring tasks
  - Templates are readable by all authenticated users
  - Routine actions follow parent routine permissions
*/

-- Create routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('morning', 'evening', 'custom')),
  description text DEFAULT '',
  icon text DEFAULT 'Zap',
  color text DEFAULT 'blue',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create routine_actions table
CREATE TABLE IF NOT EXISTS routine_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid REFERENCES routines(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}'::jsonb,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create routine_templates table
CREATE TABLE IF NOT EXISTS routine_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('productivity', 'wellness', 'finance', 'lifestyle')),
  icon text DEFAULT 'Sparkles',
  actions jsonb DEFAULT '[]'::jsonb,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create recurring_tasks table
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_type text NOT NULL,
  task_data jsonb DEFAULT '{}'::jsonb,
  recurrence_pattern text NOT NULL CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'custom')),
  recurrence_config jsonb DEFAULT '{}'::jsonb,
  next_occurrence timestamptz NOT NULL,
  last_generated timestamptz,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routines
CREATE POLICY "Users can view own routines"
  ON routines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own routines"
  ON routines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON routines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON routines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for routine_actions
CREATE POLICY "Users can view actions for own routines"
  ON routine_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_actions.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create actions for own routines"
  ON routine_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_actions.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update actions for own routines"
  ON routine_actions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_actions.routine_id
      AND routines.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_actions.routine_id
      AND routines.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete actions for own routines"
  ON routine_actions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE routines.id = routine_actions.routine_id
      AND routines.user_id = auth.uid()
    )
  );

-- RLS Policies for routine_templates
CREATE POLICY "Anyone can view templates"
  ON routine_templates FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for recurring_tasks
CREATE POLICY "Users can view own recurring tasks"
  ON recurring_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring tasks"
  ON recurring_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring tasks"
  ON recurring_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring tasks"
  ON recurring_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_actions_routine_id ON routine_actions(routine_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_user_id ON recurring_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_next_occurrence ON recurring_tasks(next_occurrence) WHERE enabled = true;

-- Insert default routine templates
INSERT INTO routine_templates (name, description, category, icon, actions) VALUES
  (
    'Productive Morning',
    'Start your day with focus: mood check, plan tasks, review goals',
    'productivity',
    'Sunrise',
    '[
      {"type": "log_mood", "data": {"prompt": "How are you feeling this morning?"}},
      {"type": "open_planner", "data": {"message": "Plan your top 3 priorities for today"}},
      {"type": "review_goals", "data": {"message": "Review your weekly goals"}}
    ]'::jsonb
  ),
  (
    'Evening Wind Down',
    'Reflect and prepare: journal, review achievements, plan tomorrow',
    'productivity',
    'Moon',
    '[
      {"type": "open_journal", "data": {"prompt": "What went well today?"}},
      {"type": "review_achievements", "data": {}},
      {"type": "open_planner", "data": {"message": "Quick preview of tomorrow"}}
    ]'::jsonb
  ),
  (
    'Wellness Check-In',
    'Track your health: log mood, check workout plan, review meals',
    'wellness',
    'Heart',
    '[
      {"type": "log_mood", "data": {}},
      {"type": "open_gym", "data": {"message": "Did you work out today?"}},
      {"type": "open_meal_prep", "data": {"message": "Log your meals"}}
    ]'::jsonb
  ),
  (
    'Finance Review',
    'Money matters: check savings goal, review expenses, upcoming bills',
    'finance',
    'DollarSign',
    '[
      {"type": "open_savings", "data": {}},
      {"type": "open_finance", "data": {"tab": "expenses"}},
      {"type": "open_finance", "data": {"tab": "bills"}}
    ]'::jsonb
  ),
  (
    'Self-Care Sunday',
    'Pamper yourself: skincare routine, wellness check, plan week ahead',
    'lifestyle',
    'Sparkles',
    '[
      {"type": "open_skincare", "data": {}},
      {"type": "open_wellness", "data": {}},
      {"type": "open_planner", "data": {"message": "Plan your week"}}
    ]'::jsonb
  )
ON CONFLICT DO NOTHING;