/*
  # Add Skincare Routine Timetable

  1. New Tables
    - `skincare_routine_schedules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `time_of_day` (text, 'AM' or 'PM')
      - `scheduled_time` (time, e.g., '08:00:00', '22:00:00')
      - `day_of_week` (text array, e.g., ['monday', 'tuesday', 'wednesday'])
      - `products` (uuid array, references skincare_products)
      - `is_active` (boolean, default true)
      - `reminder_enabled` (boolean, default false)
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `skincare_routine_schedules` table
    - Add policies for authenticated users to manage their own schedules
*/

-- Create skincare routine schedules table
CREATE TABLE IF NOT EXISTS skincare_routine_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  time_of_day text NOT NULL CHECK (time_of_day IN ('AM', 'PM')),
  scheduled_time time NOT NULL,
  day_of_week text[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  products uuid[] DEFAULT ARRAY[]::uuid[],
  is_active boolean DEFAULT true,
  reminder_enabled boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE skincare_routine_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own skincare schedules"
  ON skincare_routine_schedules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare schedules"
  ON skincare_routine_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare schedules"
  ON skincare_routine_schedules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare schedules"
  ON skincare_routine_schedules
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_skincare_schedules_user_id ON skincare_routine_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_skincare_schedules_active ON skincare_routine_schedules(user_id, is_active) WHERE is_active = true;