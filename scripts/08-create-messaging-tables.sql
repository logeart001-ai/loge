-- =====================================================
-- MESSAGING SYSTEM SCHEMA
-- Created: October 13, 2025
-- Purpose: Direct messaging between collectors and creators
-- =====================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- =====================================================
-- CONVERSATIONS TABLE
-- Stores conversation metadata between two users
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  participant_1_unread_count INTEGER DEFAULT 0,
  participant_2_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure participant_1_id < participant_2_id for consistent ordering
  CONSTRAINT conversations_participants_ordered CHECK (participant_1_id < participant_2_id),
  
  -- Ensure unique conversation between two users
  CONSTRAINT conversations_unique_participants UNIQUE (participant_1_id, participant_2_id)
);

-- Index for faster lookups
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- =====================================================
-- MESSAGES TABLE
-- Stores individual messages within conversations
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validation
  CONSTRAINT messages_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT messages_content_length CHECK (LENGTH(content) <= 5000)
);

-- Indexes for faster queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_order ON messages(order_id) WHERE order_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS POLICIES
-- Users can view conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- Users can create conversations (insert will be handled by function)
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- Users can update their own conversations (for unread counts)
CREATE POLICY "Users can update their conversations"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- MESSAGES POLICIES
-- Users can view messages in their conversations
CREATE POLICY "Users can view their messages"
  ON messages
  FOR SELECT
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
  );

-- Users can update messages they received (to mark as read)
CREATE POLICY "Users can mark received messages as read"
  ON messages
  FOR UPDATE
  USING (
    auth.uid() = receiver_id
  )
  WITH CHECK (
    auth.uid() = receiver_id
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get or create a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_uuid UUID;
  ordered_user1_id UUID;
  ordered_user2_id UUID;
BEGIN
  -- Order the user IDs to maintain consistency
  IF user1_id < user2_id THEN
    ordered_user1_id := user1_id;
    ordered_user2_id := user2_id;
  ELSE
    ordered_user1_id := user2_id;
    ordered_user2_id := user1_id;
  END IF;

  -- Try to get existing conversation
  SELECT id INTO conversation_uuid
  FROM conversations
  WHERE participant_1_id = ordered_user1_id 
    AND participant_2_id = ordered_user2_id;

  -- If not found, create new conversation
  IF conversation_uuid IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id)
    VALUES (ordered_user1_id, ordered_user2_id)
    RETURNING id INTO conversation_uuid;
  END IF;

  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation metadata when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  other_user_id UUID;
BEGIN
  -- Determine the other user (receiver)
  other_user_id := NEW.receiver_id;

  -- Update conversation metadata
  UPDATE conversations
  SET 
    last_message = SUBSTRING(NEW.content, 1, 100),
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at,
    -- Increment unread count for receiver
    participant_1_unread_count = CASE 
      WHEN participant_1_id = other_user_id 
      THEN participant_1_unread_count + 1 
      ELSE participant_1_unread_count 
    END,
    participant_2_unread_count = CASE 
      WHEN participant_2_id = other_user_id 
      THEN participant_2_unread_count + 1 
      ELSE participant_2_unread_count 
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark messages as read and update unread count
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark messages as read
  UPDATE messages
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE 
    conversation_id = p_conversation_id 
    AND receiver_id = p_user_id 
    AND is_read = FALSE
  RETURNING COUNT(*) INTO updated_count;

  -- Reset unread count for the user
  UPDATE conversations
  SET 
    participant_1_unread_count = CASE 
      WHEN participant_1_id = p_user_id THEN 0 
      ELSE participant_1_unread_count 
    END,
    participant_2_unread_count = CASE 
      WHEN participant_2_id = p_user_id THEN 0 
      ELSE participant_2_unread_count 
    END,
    updated_at = NOW()
  WHERE id = p_conversation_id;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE conversations IS 'Stores conversation metadata between two users';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON FUNCTION get_or_create_conversation(UUID, UUID) IS 'Gets existing conversation or creates new one between two users';
COMMENT ON FUNCTION mark_messages_as_read(UUID, UUID) IS 'Marks all unread messages in a conversation as read for a user';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show created tables
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename;

-- Show indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, indexname;

-- Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this script in Supabase SQL editor
-- 2. Verify tables and policies were created
-- 3. Test with sample data
-- =====================================================
