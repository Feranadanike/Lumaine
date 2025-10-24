/*
  # Add Bills and Subscriptions Tracking

  1. New Tables
    - `bills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `bill_name` (text) - Name of the bill (e.g., "Electricity", "Rent")
      - `amount` (decimal) - Bill amount
      - `due_day` (integer) - Day of month the bill is due (1-31)
      - `category` (text) - Category like utilities, insurance, etc.
      - `is_autopay` (boolean) - Whether bill is on autopay
      - `notes` (text, optional) - Additional notes
      - `is_active` (boolean) - Whether bill is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `bill_payments`
      - `id` (uuid, primary key)
      - `bill_id` (uuid, references bills)
      - `user_id` (uuid, references auth.users)
      - `amount` (decimal) - Amount paid
      - `payment_date` (date) - Date of payment
      - `notes` (text, optional)
      - `created_at` (timestamptz)
    
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `service_name` (text) - Name of service (e.g., "Netflix", "Spotify")
      - `amount` (decimal) - Subscription cost
      - `billing_cycle` (text) - monthly, yearly, weekly
      - `next_billing_date` (date) - Next billing date
      - `category` (text) - Category like entertainment, software, etc.
      - `is_active` (boolean) - Whether subscription is active
      - `notes` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own bills and subscriptions
*/

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bill_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  due_day integer NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  category text NOT NULL,
  is_autopay boolean DEFAULT false,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  next_billing_date date NOT NULL,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bills"
  ON bills FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
  ON bills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bills"
  ON bills FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bills"
  ON bills FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bill payments"
  ON bill_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bill payments"
  ON bill_payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bill payments"
  ON bill_payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bill payments"
  ON bill_payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);