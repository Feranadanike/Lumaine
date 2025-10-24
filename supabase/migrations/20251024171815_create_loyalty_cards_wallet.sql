/*
  # Create Loyalty Cards Wallet System

  1. New Tables
    - `loyalty_cards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `card_name` (text) - Store/brand name (e.g., "Starbucks", "Target")
      - `card_number` (text) - The loyalty card number or barcode value
      - `barcode_type` (text) - Type of barcode (CODE128, EAN13, QR, etc.)
      - `category` (text) - Category (grocery, coffee, retail, gas, restaurant, etc.)
      - `color` (text) - Brand color for visual identification
      - `notes` (text) - Optional notes (member ID, phone number, etc.)
      - `is_favorite` (boolean) - Mark frequently used cards
      - `points_balance` (text) - Optional points/balance tracking
      - `expiry_date` (date) - Optional expiry date
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on `loyalty_cards` table
    - Add policies for authenticated users to manage their own cards
    
  3. Notes
    - Barcode types supported: CODE128, EAN13, EAN8, UPC, QR
    - Categories: grocery, coffee, retail, gas, restaurant, pharmacy, gym, other
    - Colors stored as hex values or preset names
*/

CREATE TABLE IF NOT EXISTS loyalty_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_name text NOT NULL,
  card_number text NOT NULL,
  barcode_type text DEFAULT 'CODE128' NOT NULL,
  category text DEFAULT 'other',
  color text DEFAULT 'blue',
  notes text DEFAULT '',
  is_favorite boolean DEFAULT false,
  points_balance text DEFAULT '',
  expiry_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty cards"
  ON loyalty_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty cards"
  ON loyalty_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loyalty cards"
  ON loyalty_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loyalty cards"
  ON loyalty_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_cards_user_id ON loyalty_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_category ON loyalty_cards(category);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_favorite ON loyalty_cards(is_favorite);