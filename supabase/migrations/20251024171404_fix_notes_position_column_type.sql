/*
  # Fix Notes Position Column Type

  1. Changes
    - Change `position` column from integer to bigint to handle timestamp values
    - Integer range is limited to ~2.1 billion, timestamps exceed this
    - Bigint can handle large timestamp values like 1761325988789
    
  2. Notes
    - This fixes the "value out of range for type integer" error
    - Existing data is preserved during type conversion
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'position' AND data_type = 'integer'
  ) THEN
    ALTER TABLE notes ALTER COLUMN position TYPE bigint;
  END IF;
END $$;