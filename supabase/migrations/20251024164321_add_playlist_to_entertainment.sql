/*
  # Add Playlist Support to Entertainment Items

  1. Changes
    - Add `playlist` column to `entertainment_items` table
      - Optional text field to group items into custom playlists
      - Allows users to create custom collections like "Horror Romance Books", "90s Action Movies", etc.
      - Items without a playlist value will be shown as "Uncategorized"
  
  2. Notes
    - Existing items will have NULL playlist values (shown as uncategorized)
    - Playlist names are user-defined and created on-the-fly
    - Same playlist name can be used across different types (e.g., "Favorites" for both books and movies)
*/

-- Add playlist column to entertainment_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entertainment_items' AND column_name = 'playlist'
  ) THEN
    ALTER TABLE entertainment_items ADD COLUMN playlist text;
  END IF;
END $$;