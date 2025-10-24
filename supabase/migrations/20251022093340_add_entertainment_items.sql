/*
  # Add Entertainment Items Table

  1. New Tables
    - `entertainment_items`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, required) - Name of the book/movie/show/artist/podcast
      - `type` (text, required) - Category: Book, Movie, TV Show, Artist, Podcast
      - `where_to_find` (text, optional) - Platform like Netflix, Spotify, etc.
      - `notes` (text, optional) - Quick notes or who recommended it
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `entertainment_items` table
    - Add policies for authenticated users to manage their own items
*/

CREATE TABLE IF NOT EXISTS entertainment_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('Book', 'Movie', 'TV Show', 'Artist', 'Podcast')),
  where_to_find text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE entertainment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entertainment items"
  ON entertainment_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entertainment items"
  ON entertainment_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entertainment items"
  ON entertainment_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own entertainment items"
  ON entertainment_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);