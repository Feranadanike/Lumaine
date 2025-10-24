/*
  # Add Note Type and Styling Support

  1. Changes
    - Add `is_quick` column to differentiate quick notes from detailed notes
    - Add `color` column to store custom gradient/color choices for quick notes
    - Add `position` column for custom ordering (future drag-drop support)
    
  2. Note Types
    - Quick Notes: Fast capture, no title required, colorful bubbles
    - Detailed Notes: Full notes with title and rich content
    
  3. Color Options
    - energetic: Orange/amber gradient
    - calm: Blue/cyan gradient  
    - creative: Purple/pink gradient
    - success: Green/emerald gradient
    - sunset: Pink/orange gradient
    - ocean: Teal/blue gradient
    - default: Neutral gray gradient
*/

-- Add new columns to notes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'is_quick'
  ) THEN
    ALTER TABLE notes ADD COLUMN is_quick boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'color'
  ) THEN
    ALTER TABLE notes ADD COLUMN color text DEFAULT 'default';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notes' AND column_name = 'position'
  ) THEN
    ALTER TABLE notes ADD COLUMN position integer DEFAULT 0;
  END IF;
END $$;