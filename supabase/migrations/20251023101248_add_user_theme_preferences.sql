/*
  # Add User Theme Preferences

  1. Changes
    - Add theme customization columns to user_profiles table
      - `theme_color` (text) - User's chosen color theme
      - `theme_font` (text) - User's chosen font family
      - `theme_mode` (text) - Light or dark mode preference
  
  2. Security
    - Users can only update their own theme preferences through existing RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme_color'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN theme_color text DEFAULT 'purple';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme_font'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN theme_font text DEFAULT 'sans';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'theme_mode'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN theme_mode text DEFAULT 'light';
  END IF;
END $$;