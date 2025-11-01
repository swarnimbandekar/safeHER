-- Create community_messages table
CREATE TABLE IF NOT EXISTS community_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_user_id ON community_messages(user_id);

-- Add RLS policies
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view all messages (public community chat)
CREATE POLICY "Anyone can view community messages"
ON community_messages FOR SELECT
USING (true);

-- Policy: Authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages"
ON community_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON community_messages FOR DELETE
USING (auth.uid() = user_id);
