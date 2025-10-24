/*
  # Create Saved Links Feature

  ## Overview
  This migration creates a saved links system where users can bookmark URLs with descriptions,
  categories, tags, and priority levels. Perfect for shopping lists, videos to watch, articles
  to read, and more.

  ## New Tables
  1. `saved_links`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, foreign key) - Links to auth.users
    - `url` (text, required) - The saved URL
    - `title` (text, optional) - Link title/name
    - `description` (text, required) - User's description of why they saved it
    - `category` (text, required) - Category (Groceries, Clothes, Videos, etc.)
    - `tags` (text array, optional) - Additional tags for organization
    - `priority` (text, optional) - Priority level (high, medium, low)
    - `is_completed` (boolean) - Whether the item has been purchased/completed
    - `notes` (text, optional) - Additional notes
    - `created_at` (timestamptz) - When the link was saved
    - `updated_at` (timestamptz) - Last update time

  ## Security
  - Enable RLS on `saved_links` table
  - Users can only view their own saved links
  - Users can insert their own saved links
  - Users can update their own saved links
  - Users can delete their own saved links
*/

-- Create saved_links table
CREATE TABLE IF NOT EXISTS saved_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  title text,
  description text NOT NULL,
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  priority text DEFAULT 'medium',
  is_completed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own saved links"
  ON saved_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved links"
  ON saved_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved links"
  ON saved_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved links"
  ON saved_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_links_user_id ON saved_links(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_links_category ON saved_links(category);
CREATE INDEX IF NOT EXISTS idx_saved_links_created_at ON saved_links(created_at DESC);