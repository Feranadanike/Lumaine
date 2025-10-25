/*
  # Add Study Assistant Tables

  1. New Tables
    - `study_materials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references study_sessions)
      - `file_name` (text) - Original file name
      - `file_type` (text) - mime type (pdf, image, text)
      - `file_url` (text) - Storage URL for the file
      - `extracted_text` (text) - Text extracted from file for AI context
      - `created_at` (timestamptz)
    
    - `study_chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `session_id` (uuid, references study_sessions)
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - Message content
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own materials and chat messages
    - All policies check authentication and ownership

  3. Important Notes
    - Study materials are linked to specific sessions
    - Chat messages track AI conversation during study
    - Extracted text helps AI understand uploaded content
    - Files stored in Supabase storage for persistence
*/

-- Create study_materials table
CREATE TABLE IF NOT EXISTS study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  extracted_text text,
  created_at timestamptz DEFAULT now()
);

-- Create study_chat_messages table
CREATE TABLE IF NOT EXISTS study_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES study_sessions(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for study_materials
CREATE POLICY "Users can view own study materials"
  ON study_materials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study materials"
  ON study_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study materials"
  ON study_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study materials"
  ON study_materials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for study_chat_messages
CREATE POLICY "Users can view own study chat messages"
  ON study_chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study chat messages"
  ON study_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study chat messages"
  ON study_chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-materials', 'study-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own study materials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own study materials"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own study materials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'study-materials' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );