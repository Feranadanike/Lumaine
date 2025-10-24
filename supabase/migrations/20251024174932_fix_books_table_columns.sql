/*
  # Fix Books Table Columns

  ## Changes
  - Add missing `notes` column for reading notes
  - Add missing `updated_at` column for tracking updates
  - Rename `start_date` to `started_date` for consistency
  - Rename `finish_date` to `completed_date` for consistency
*/

-- Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'notes'
  ) THEN
    ALTER TABLE books ADD COLUMN notes text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE books ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Rename columns for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE books RENAME COLUMN start_date TO started_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'finish_date'
  ) THEN
    ALTER TABLE books RENAME COLUMN finish_date TO completed_date;
  END IF;
END $$;