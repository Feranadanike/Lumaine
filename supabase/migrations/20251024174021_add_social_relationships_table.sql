/*
  # Add Social Relationships Feature

  ## New Table
  
  ### social_relationships
  Tracks important people, dates, birthdays, anniversaries, and gift ideas
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `name` (text) - Person's name
  - `relationship_type` (text) - 'family', 'friend', 'partner', 'colleague', 'other'
  - `birthday` (date, nullable) - Birthday date
  - `anniversary_date` (date, nullable) - Anniversary date
  - `other_important_dates` (jsonb, nullable) - Flexible date tracking (array of {name, date})
  - `gift_ideas` (text[], nullable) - List of gift ideas
  - `notes` (text, nullable) - Additional notes
  - `photo_url` (text, nullable) - Profile photo
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on table
  - Users can only access their own relationships
*/

CREATE TABLE IF NOT EXISTS social_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  relationship_type text NOT NULL DEFAULT 'friend',
  birthday date,
  anniversary_date date,
  other_important_dates jsonb DEFAULT '[]',
  gift_ideas text[] DEFAULT '{}',
  notes text DEFAULT '',
  photo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE social_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationships"
  ON social_relationships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationships"
  ON social_relationships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationships"
  ON social_relationships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationships"
  ON social_relationships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_relationships_user_id ON social_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_social_relationships_birthday ON social_relationships(birthday);