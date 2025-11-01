-- Create location_sharing_contacts table
CREATE TABLE IF NOT EXISTS location_sharing_contacts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_location_sharing_contacts_user_id ON location_sharing_contacts(user_id);

-- Add RLS policies
ALTER TABLE location_sharing_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own contacts
CREATE POLICY "Users can view their own location sharing contacts"
ON location_sharing_contacts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own contacts
CREATE POLICY "Users can insert their own location sharing contacts"
ON location_sharing_contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own contacts
CREATE POLICY "Users can update their own location sharing contacts"
ON location_sharing_contacts FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own contacts
CREATE POLICY "Users can delete their own location sharing contacts"
ON location_sharing_contacts FOR DELETE
USING (auth.uid() = user_id);
