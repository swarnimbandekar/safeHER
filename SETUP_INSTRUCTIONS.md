# Setup Instructions for New Features

## Changes Made

### 1. Mock Location Data for SOS
- Added a `getMockLocation()` method to the geolocation service that returns coordinates for New York City (40.7128, -74.0060)
- Updated the SOS button functionality to use mock location when geolocation fails or times out
- Updated location sharing to also fall back to mock location when needed

### 2. Location Sharing Contacts in Profile
- Added a new section in the Profile page to manage up to 3 location sharing contacts
- Users can add contacts with name and phone number
- Users can view and delete their saved contacts
- Beautiful UI with form validation and error handling

### 3. Community Chat Feature
- Completely redesigned the Community Watch page with two tabs: Chat and Map
- Real-time community messaging with instant updates
- Users can send text messages to the community
- Users can share their location in the chat
- Beautiful WhatsApp-style chat UI with message bubbles
- Auto-scroll to latest messages
- Date separators for better organization
- Dark mode support throughout
- Realtime subscriptions using Supabase Realtime

## Database Setup

You need to run TWO SQL migrations for the new features:

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor

**For Location Sharing Contacts:**
3. Copy and paste the contents of `supabase/migrations/20250201_location_sharing_contacts.sql`
4. Click "Run" to execute the migration

**For Community Chat:**
5. Copy and paste the contents of `supabase/migrations/20250201_community_messages.sql`
6. Click "Run" to execute the migration

### Option 2: Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push
```

## Testing the Features

### Test Mock Location Data
1. Click on the SOS button on the home page
2. If location permission is denied or times out, the app will automatically use mock location data
3. The SOS alert will be sent with coordinates: 40.7128, -74.0060 (New York City)
4. Check the browser console - you'll see "Using mock location for SOS"

### Test Location Sharing Contacts
1. Navigate to the Profile page
2. Scroll down to the "Location Sharing Contacts" section
3. Click "Add Contact" button
4. Fill in the name and phone number
5. Click "Save"
6. You can add up to 3 contacts
7. To remove a contact, click the trash icon next to it

### Test Community Chat
1. Navigate to the Community Watch page from the bottom navigation
2. The page opens on the "Community Chat" tab by default
3. Type a message in the input field at the bottom
4. Press Enter or click the Send button to send the message
5. Your message appears on the right side in pink
6. Other users' messages appear on the left side
7. Click the map pin icon to share your location
8. Click the "Map View" tab to see the map with Sakhi volunteers
9. Messages update in real-time - open the app in multiple tabs to test!

## Features

### Location Features
- ✅ Mock location fallback for SOS when geolocation fails
- ✅ Mock location fallback for location sharing when geolocation fails
- ✅ Add up to 3 location sharing contacts
- ✅ View all saved contacts
- ✅ Delete contacts

### Community Chat Features
- ✅ Real-time messaging with instant updates
- ✅ Send text messages to community
- ✅ Share location in chat with clickable map links
- ✅ WhatsApp-style chat UI with message bubbles
- ✅ Auto-scroll to latest messages
- ✅ Date separators (Today, Yesterday, etc.)
- ✅ Message timestamps
- ✅ User name display for other users
- ✅ Tab navigation between Chat and Map views
- ✅ Loading states and empty states
- ✅ Enter key to send messages

### General Features
- ✅ Form validation
- ✅ Success/error notifications
- ✅ Dark mode support throughout
- ✅ Responsive design
- ✅ Real-time database subscriptions
