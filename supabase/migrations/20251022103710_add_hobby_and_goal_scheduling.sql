/*
  # Add Hobby and Goal Scheduling for Today's Tasks

  1. Changes to Tables
    - Add scheduling fields to `hobbies` table
      - `days_of_week` (text[]) - Array of days (monday, tuesday, etc.)
      - `preferred_time` (time) - Optional scheduled time
    - Add scheduling fields to `goals` table
      - `daily_task_enabled` (boolean) - Whether to show in Today's Tasks
      - `daily_task_description` (text) - What to show as the task

  2. Notes
    - These fields enable hobbies and goals to appear in Today's Tasks
    - Hobbies can be scheduled for specific days like workouts
    - Goals can have a daily task reminder
*/

-- Add scheduling to hobbies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hobbies' AND column_name = 'days_of_week'
  ) THEN
    ALTER TABLE hobbies ADD COLUMN days_of_week text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hobbies' AND column_name = 'preferred_time'
  ) THEN
    ALTER TABLE hobbies ADD COLUMN preferred_time time;
  END IF;
END $$;

-- Add daily task fields to goals table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'daily_task_enabled'
  ) THEN
    ALTER TABLE goals ADD COLUMN daily_task_enabled boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'daily_task_description'
  ) THEN
    ALTER TABLE goals ADD COLUMN daily_task_description text;
  END IF;
END $$;
