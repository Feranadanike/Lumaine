/*
  # Add Missing Columns to Planned Workouts

  1. Changes
    - Add `is_active` boolean column to `planned_workouts` table (default true)
    - Rename `day_of_week` to support multiple days by adding `days_of_week` text array column
    - Keep `day_of_week` for backward compatibility initially
  
  2. Notes
    - The `is_active` column allows users to temporarily disable planned workouts without deleting them
    - The `days_of_week` column supports workouts scheduled for multiple days
*/

-- Add is_active column to planned_workouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'planned_workouts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE planned_workouts ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add days_of_week array column to planned_workouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'planned_workouts' AND column_name = 'days_of_week'
  ) THEN
    ALTER TABLE planned_workouts ADD COLUMN days_of_week text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Migrate existing day_of_week data to days_of_week array
UPDATE planned_workouts
SET days_of_week = ARRAY[
  CASE day_of_week
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END
]
WHERE days_of_week = ARRAY[]::text[] OR days_of_week IS NULL;