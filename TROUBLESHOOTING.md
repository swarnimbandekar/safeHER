# Troubleshooting Guide

## Issue 1: App Stuck on Loading Screen

### Problem
When you reload the app, you see a loading screen that never finishes.

### Solution ✅ FIXED
This has been fixed in the AuthContext. The loading state now properly resolves.

**What was fixed:**
- Changed from callback-based async code to proper async/await
- Added proper error handling with try-catch-finally
- Ensured `setLoading(false)` always runs in the finally block

**What to do:**
1. Refresh your browser (Ctrl+R or Cmd+R)
2. Clear browser cache if still having issues (Ctrl+Shift+Delete)
3. The loading screen should now disappear properly

---

## Issue 2: Can't Send Messages in Community Chat

### Problem
When you click send in the community chat, nothing happens or you get an error.

### Possible Causes & Solutions

#### Cause 1: Database Table Doesn't Exist ❌
**Check if you ran the migration:**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Open your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the contents of `supabase/migrations/20250201_community_messages.sql`
6. Paste and click "Run"

**Expected output:**
- "Success. No rows returned"
- Or you'll see the table already exists

#### Cause 2: Profile Not Loaded 📋
**The error message will say: "Profile not loaded. Please refresh the page."**

**Solution:**
1. Check browser console (F12 → Console tab)
2. Look for errors about profiles table
3. Make sure you're signed in
4. Try signing out and back in
5. Refresh the page

#### Cause 3: RLS (Row Level Security) Policies 🔒
**Error message might mention "permission denied" or "policy"**

**Solution:**
Make sure you ran the FULL migration SQL including the RLS policies at the bottom:
```sql
-- These lines must be in your migration:
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community messages"
ON community_messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert messages"
ON community_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### Cause 4: Realtime Not Enabled 🔴
**Messages send but don't appear in real-time**

**Solution:**
1. Go to Supabase Dashboard
2. Click "Database" → "Replication"
3. Find the "community_messages" table
4. Toggle it ON for Realtime
5. Click "Save"

---

## How to Debug

### Step 1: Open Browser Console
Press F12 (or Cmd+Option+I on Mac) to open Developer Tools

### Step 2: Go to Console Tab
Look for error messages in red

### Step 3: Common Error Messages

#### "relation 'community_messages' does not exist"
→ **Run the database migration!** (See Issue 2, Cause 1 above)

#### "Profile not loaded. Please refresh the page."
→ **Sign out and sign back in**, or check if profiles table exists

#### "permission denied for table community_messages"
→ **RLS policies missing!** Run the full migration SQL

#### "new row violates row-level security policy"
→ **RLS policy issue.** Make sure the INSERT policy exists:
```sql
CREATE POLICY "Authenticated users can insert messages"
ON community_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### No error, but messages don't appear
→ **Check Realtime is enabled** (See Issue 2, Cause 4 above)

---

## Quick Checklist ✅

Before using community chat, make sure:

- [ ] You ran `20250201_community_messages.sql` migration
- [ ] You ran `20250201_location_sharing_contacts.sql` migration
- [ ] Both tables show up in Supabase Dashboard → Database → Tables
- [ ] RLS is enabled on both tables
- [ ] Realtime replication is enabled for community_messages
- [ ] You're signed in to the app
- [ ] Your profile exists (check Profile page)
- [ ] Browser console shows no errors (F12)

---

## Test the Fix

### Test 1: Check Database Table
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Look for "community_messages" in the list
4. If you see it, ✅ table exists!
5. If not, ❌ run the migration

### Test 2: Try Sending a Message
1. Go to Community Watch page
2. Type "test" in the message box
3. Click Send or press Enter
4. Check browser console (F12)
5. Look for log: "Sending message: {user_id: ..., user_name: ...}"
6. Then look for: "Message sent successfully: [...]"
7. If you see both logs, ✅ it works!
8. If you see an error, read the error message

### Test 3: Test Real-Time Updates
1. Open the app in two browser tabs
2. Sign in with the same or different accounts
3. Go to Community Watch in both tabs
4. Send a message from Tab 1
5. Does it appear in Tab 2?
6. If YES, ✅ Realtime works!
7. If NO, enable Realtime replication

---

## Still Having Issues?

### Check These Files Exist:
```
supabase/migrations/
├── 20250201_location_sharing_contacts.sql  ← Must exist
└── 20250201_community_messages.sql         ← Must exist
```

### Verify Your .env File:
```
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Check Supabase Connection:
1. Open browser console (F12)
2. Type: `localStorage.getItem('supabase.auth.token')`
3. If you see a long string, ✅ you're connected
4. If null, try signing in again

---

## Complete Reset (Last Resort)

If nothing works:

1. **Sign Out** from the app
2. **Clear Browser Data**:
   - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete)
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"
3. **Close and Reopen Browser**
4. **Run Both Migrations** in Supabase Dashboard
5. **Sign In** to the app again
6. **Test** sending a message

---

## Getting Help

When asking for help, provide:
1. Screenshot of browser console (F12 → Console tab)
2. Screenshot of Supabase Table Editor showing your tables
3. Error message you're seeing
4. Which step you're stuck on

---

## Summary of Fixes Applied

✅ **Fixed infinite loading**: AuthContext now properly handles async initialization
✅ **Better error messages**: You'll now see exactly what's wrong
✅ **Profile validation**: Checks if profile exists before sending messages
✅ **Console logging**: Added detailed logs for debugging
✅ **Error display**: Errors now show prominently in the UI
✅ **Error dismissal**: You can dismiss error messages

**The app should now work smoothly!** 🎉
