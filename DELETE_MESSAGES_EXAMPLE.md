# How to Delete Community Messages

## Option 1: Supabase Dashboard (Recommended)

### SQL Editor Method:
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Run appropriate query below:

```sql
-- Delete all messages from a specific user by user_id
DELETE FROM community_messages 
WHERE user_id = 'your-user-uuid-here';

-- Delete all messages from a user by name
DELETE FROM community_messages 
WHERE user_name = 'John Doe';

-- Delete a specific message by ID
DELETE FROM community_messages 
WHERE id = 123;

-- Delete all messages (CAREFUL!)
DELETE FROM community_messages;

-- Delete messages older than 7 days
DELETE FROM community_messages 
WHERE created_at < NOW() - INTERVAL '7 days';

-- See message count before deleting
SELECT COUNT(*) FROM community_messages WHERE user_id = 'user-uuid';
```

### Table Editor Method:
1. Go to Table Editor
2. Select "community_messages" table
3. Use filters to find messages
4. Click trash icon to delete rows

---

## Option 2: Add Delete Feature in App

### Add Delete Button to Messages

Update `src/pages/CommunityWatch.tsx`:

```typescript
// Add delete function
const handleDeleteMessage = async (messageId: number) => {
  if (!confirm('Delete this message?')) return;

  try {
    const { error } = await supabase
      .from('community_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;

    // Refresh messages
    await loadMessages();
    setSuccess('Message deleted successfully');
  } catch (err: any) {
    setError(err.message || 'Failed to delete message');
  }
};

// In the message rendering section, add delete button:
{isOwnMessage(message) && (
  <button
    onClick={() => handleDeleteMessage(message.id)}
    className="text-xs text-red-500 hover:text-red-700 mt-1"
  >
    Delete
  </button>
)}
```

---

## Option 3: Create Admin Panel

### Simple Admin Delete Script

Create a file `src/admin/DeleteMessages.tsx`:

```typescript
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function AdminDeleteMessages() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const deleteUserMessages = async () => {
    if (!userId) {
      setResult('Please enter a user ID');
      return;
    }

    if (!confirm(`Delete ALL messages from user: ${userId}?`)) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .delete()
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      setResult(`✅ Deleted ${data?.length || 0} messages`);
    } catch (err: any) {
      setResult(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Delete User Messages</h2>
      
      <input
        type="text"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Enter user_id (UUID)"
        className="border rounded px-4 py-2 w-full mb-4"
      />

      <button
        onClick={deleteUserMessages}
        disabled={loading}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
      >
        {loading ? 'Deleting...' : 'Delete Messages'}
      </button>

      {result && (
        <p className="mt-4 p-3 bg-gray-100 rounded">{result}</p>
      )}
    </div>
  );
}
```

---

## Option 4: Bulk Delete by User Name

```sql
-- Find all messages from a user first
SELECT id, user_name, message, created_at 
FROM community_messages 
WHERE user_name ILIKE '%search-name%';

-- Then delete them
DELETE FROM community_messages 
WHERE user_name ILIKE '%search-name%';
```

---

## Option 5: Get User ID First, Then Delete

```sql
-- Step 1: Find the user_id from a message
SELECT DISTINCT user_id, user_name 
FROM community_messages 
WHERE user_name = 'John Doe';

-- Step 2: Copy the user_id and delete all their messages
DELETE FROM community_messages 
WHERE user_id = 'paste-uuid-here';
```

---

## Security Notes

⚠️ **Current RLS Policy**: Users can only delete their own messages

If you want to delete as admin:
1. Use Supabase Dashboard SQL Editor (bypasses RLS)
2. Or update RLS policy to allow admin deletes

### Add Admin Delete Policy:
```sql
-- Allow service role to delete any message
CREATE POLICY "Service role can delete any message"
ON community_messages FOR DELETE
USING (auth.jwt()->>'role' = 'service_role');
```

---

## Quick Commands

### Delete all messages from last hour:
```sql
DELETE FROM community_messages 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Delete test messages:
```sql
DELETE FROM community_messages 
WHERE message ILIKE '%test%';
```

### Count messages before deleting:
```sql
SELECT user_name, COUNT(*) as message_count
FROM community_messages 
GROUP BY user_name
ORDER BY message_count DESC;
```

---

## Recommended Approach

**For regular cleanup:**
1. Use Supabase Dashboard SQL Editor
2. Run SELECT query first to verify
3. Then run DELETE query

**Example workflow:**
```sql
-- 1. See what will be deleted
SELECT * FROM community_messages 
WHERE user_id = 'uuid-here';

-- 2. If correct, delete
DELETE FROM community_messages 
WHERE user_id = 'uuid-here';

-- 3. Verify deletion
SELECT COUNT(*) FROM community_messages 
WHERE user_id = 'uuid-here';  -- Should return 0
```

---

## Need User UUID?

To find a user's UUID from their name:

```sql
SELECT DISTINCT user_id, user_name, COUNT(*) as msg_count
FROM community_messages 
GROUP BY user_id, user_name
ORDER BY msg_count DESC;
```

This shows all users and their message counts!
