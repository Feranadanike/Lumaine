/*
  # Add Currency Preference to User Profiles

  1. Changes
    - Add `currency` column to `user_profiles` table
      - Stores user's preferred currency (USD, GBP, EUR, etc.)
      - Defaults to 'GBP' (pounds)
    
  2. Notes
    - Allows users to select their preferred currency for financial tracking
    - Common currencies: USD ($), GBP (£), EUR (€), JPY (¥), CAD (C$), AUD (A$), etc.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'currency'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN currency text DEFAULT 'GBP';
  END IF;
END $$;