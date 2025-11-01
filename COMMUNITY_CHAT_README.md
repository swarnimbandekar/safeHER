# Community Chat Feature 💬

A real-time community messaging system where safeHER users can communicate, share information, and support each other.

## Overview

The Community Watch page has been completely redesigned with a dual-tab interface:
- **Community Chat**: Real-time messaging platform for the community
- **Map View**: Interactive map showing nearby Sakhi volunteers

## Features

### 🗨️ Real-Time Messaging
- Send and receive messages instantly
- Messages update in real-time using Supabase Realtime subscriptions
- No page refresh needed - messages appear automatically

### 💬 WhatsApp-Style UI
- Clean, modern chat interface
- Your messages appear on the right (pink bubbles)
- Other users' messages appear on the left (white/gray bubbles)
- User names displayed for all messages
- Timestamps on every message

### 📍 Location Sharing
- Click the map pin icon to share your location in the chat
- Location messages include a clickable link to Google Maps
- Automatic fallback to mock location if geolocation is denied

### 🎨 Beautiful Design
- Date separators (Today, Yesterday, or date)
- Auto-scroll to latest messages
- Loading states while fetching messages
- Empty state with helpful prompts
- Full dark mode support
- Responsive layout for all screen sizes

### ⌨️ Smooth UX
- Press Enter to send messages (Shift+Enter for new line)
- Send button only enabled when message is typed
- Disabled states while sending
- Textarea auto-expands as you type

## How to Use

### Sending a Message
1. Navigate to the Community Watch page
2. Type your message in the input field at the bottom
3. Press Enter or click the Send button
4. Your message appears instantly in the chat

### Sharing Your Location
1. Click the map pin icon (📍) in the input area
2. Allow location permission if prompted (or use mock location)
3. A location message is automatically sent to the chat
4. Others can click "View on map" to see your location

### Viewing the Map
1. Click the "Map View" tab at the top
2. See your location and nearby Sakhi volunteers
3. Click markers for more information
4. Switch back to "Community Chat" tab anytime

## Database Schema

### community_messages Table
```sql
- id: BIGSERIAL (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- user_name: TEXT (Display name of sender)
- message: TEXT (Message content)
- location: JSONB (Optional location data)
- created_at: TIMESTAMPTZ (Timestamp)
```

### Row Level Security
- Everyone can view all messages (public chat)
- Only authenticated users can send messages
- Users can only delete their own messages

## Technical Implementation

### Real-Time Updates
Uses Supabase Realtime to subscribe to INSERT events on the `community_messages` table:
```typescript
supabase
  .channel('community_messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'community_messages'
  }, callback)
  .subscribe()
```

### Message Format
Messages support both text and location data:
```typescript
interface Message {
  id: number;
  user_id: string;
  user_name: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
}
```

### Auto-Scroll Behavior
- Automatically scrolls to the latest message when:
  - Component loads
  - New messages arrive
  - User sends a message
- Uses smooth scrolling for better UX

## Security

- All messages are public and visible to everyone
- Users must be authenticated to send messages
- User IDs are verified server-side through RLS policies
- Location data is optional and stored as JSONB

## Future Enhancements

Potential features for future versions:
- Image/file sharing
- Message reactions (emoji)
- Reply to specific messages
- Message editing
- User online status indicators
- Typing indicators
- Message search
- Pinned messages
- User profiles in chat
- Private messaging
- Message notifications

## Tips

- **Open in multiple browser tabs** to see real-time updates in action
- **Use different accounts** to test the community aspect
- **Share locations** to help others find safe zones or meeting points
- **Check the map view** to see community members' locations
- **Use dark mode** for comfortable nighttime chatting

## Support

The community chat creates a supportive environment where users can:
- Alert others about unsafe situations
- Share safe routes and locations
- Coordinate meetups for safety in numbers
- Provide emotional support
- Share local safety information
- Build a stronger community network

---

**Note**: This is a community-wide chat. All messages are visible to all users. Be respectful and supportive! 💕
