/*
  # Meal Prep System

  1. New Tables
    - `recipes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `recipe_name` (text)
      - `description` (text, nullable)
      - `ingredients` (jsonb) - array of {name, amount, unit}
      - `instructions` (text)
      - `prep_time_minutes` (integer, nullable)
      - `cook_time_minutes` (integer, nullable)
      - `servings` (integer)
      - `calories` (integer, nullable)
      - `protein` (integer, nullable) - grams
      - `carbs` (integer, nullable) - grams
      - `fats` (integer, nullable) - grams
      - `category` (text) - breakfast, lunch, dinner, snack, dessert
      - `tags` (text array, nullable) - dietary tags like vegan, gluten-free
      - `created_at` (timestamptz)

    - `meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `plan_date` (date)
      - `meal_type` (text) - breakfast, lunch, dinner, snack
      - `recipe_id` (uuid, foreign key to recipes, nullable)
      - `custom_meal_name` (text, nullable) - for quick entries without recipe
      - `notes` (text, nullable)
      - `created_at` (timestamptz)

    - `grocery_lists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `list_name` (text)
      - `created_at` (timestamptz)
      - `is_completed` (boolean, default false)

    - `grocery_items`
      - `id` (uuid, primary key)
      - `grocery_list_id` (uuid, foreign key to grocery_lists)
      - `item_name` (text)
      - `amount` (text, nullable)
      - `category` (text, nullable) - produce, dairy, meat, etc
      - `is_checked` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_name text NOT NULL,
  description text,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions text NOT NULL,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer NOT NULL DEFAULT 1,
  calories integer,
  protein integer,
  carbs integer,
  fats integer,
  category text NOT NULL DEFAULT 'dinner',
  tags text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create meal_plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_date date NOT NULL,
  meal_type text NOT NULL,
  recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  custom_meal_name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_meal_type CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'))
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal plans"
  ON meal_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create grocery_lists table
CREATE TABLE IF NOT EXISTS grocery_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  list_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_completed boolean DEFAULT false
);

ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grocery lists"
  ON grocery_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own grocery lists"
  ON grocery_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery lists"
  ON grocery_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery lists"
  ON grocery_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create grocery_items table
CREATE TABLE IF NOT EXISTS grocery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grocery_list_id uuid REFERENCES grocery_lists(id) ON DELETE CASCADE NOT NULL,
  item_name text NOT NULL,
  amount text,
  category text,
  is_checked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view grocery items from own lists"
  ON grocery_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create grocery items in own lists"
  ON grocery_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update grocery items in own lists"
  ON grocery_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete grocery items from own lists"
  ON grocery_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grocery_lists
      WHERE grocery_lists.id = grocery_items.grocery_list_id
      AND grocery_lists.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_list_id ON grocery_items(grocery_list_id);
