/*
  # Add Soft Delete Support

  1. Changes
    - Add `deleted_at` column to `user_profiles` table
    - Add `account_status` column to track account state
    - Update RLS policies to exclude soft-deleted users from normal queries
  
  2. Security
    - Soft-deleted users cannot access their data
    - Only active accounts can read their own profiles
*/

-- Add deleted_at column to track soft deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Add account_status enum for better tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('active', 'deleted', 'suspended');
  END IF;
END $$;

-- Add status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN status account_status DEFAULT 'active';
  END IF;
END $$;

-- Create index for faster queries on deleted accounts
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_at ON user_profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Drop existing RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Recreate RLS policies to exclude soft-deleted users
CREATE POLICY "Users can view own active profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND (deleted_at IS NULL OR status = 'active'));

CREATE POLICY "Users can update own active profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND (deleted_at IS NULL OR status = 'active'))
  WITH CHECK (auth.uid() = id AND (deleted_at IS NULL OR status = 'active'));

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND (deleted_at IS NULL OR status = 'active'));