# Supabase Database Setup for safeHER

Your app is now configured to connect to your own Supabase database:
- **URL**: https://bjqdwnnjqxpmrnuhbszs.supabase.co

## Quick Setup

You need to set up the database schema and seed data. Follow these steps:

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bjqdwnnjqxpmrnuhbszs
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the complete SQL from the section below
5. Click **Run** or press `Ctrl+Enter`

### Database Schema SQL

Copy this entire SQL script into the Supabase SQL Editor:

```sql
-- =====================================================
-- safeHER Database Schema - Complete Setup
-- =====================================================

-- 1. CREATE PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  profile_picture_url text,
  created_at timestamptz DEFAULT now()
);

-- 2. CREATE EMERGENCY_CONTACTS TABLE
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  relationship text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. CREATE SOS_ALERTS TABLE
CREATE TABLE IF NOT EXISTS sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at timestamptz DEFAULT now()
);

-- 4. CREATE LOCATION_SHARES TABLE
CREATE TABLE IF NOT EXISTS location_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  is_active boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. CREATE COMMUNITY_REPORTS TABLE
CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('harassment', 'unsafe_area', 'suspicious_activity', 'other')),
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now()
);

-- 6. CREATE SAFE_ZONES TABLE
CREATE TABLE IF NOT EXISTS safe_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('police_station', 'hospital', 'safe_house')),
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Emergency Contacts Policies
DROP POLICY IF EXISTS "Users can view own contacts" ON emergency_contacts;
CREATE POLICY "Users can view own contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own contacts" ON emergency_contacts;
CREATE POLICY "Users can create own contacts"
  ON emergency_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own contacts" ON emergency_contacts;
CREATE POLICY "Users can update own contacts"
  ON emergency_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own contacts" ON emergency_contacts;
CREATE POLICY "Users can delete own contacts"
  ON emergency_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SOS Alerts Policies
DROP POLICY IF EXISTS "Users can create own alerts" ON sos_alerts;
CREATE POLICY "Users can create own alerts"
  ON sos_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own alerts" ON sos_alerts;
CREATE POLICY "Users can view own alerts"
  ON sos_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON sos_alerts;
CREATE POLICY "Users can update own alerts"
  ON sos_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Location Shares Policies
DROP POLICY IF EXISTS "Users can manage own location" ON location_shares;
CREATE POLICY "Users can manage own location"
  ON location_shares FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Community Reports Policies
DROP POLICY IF EXISTS "Anyone can view reports" ON community_reports;
CREATE POLICY "Anyone can view reports"
  ON community_reports FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reports" ON community_reports;
CREATE POLICY "Authenticated users can create reports"
  ON community_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Safe Zones Policies
DROP POLICY IF EXISTS "Anyone can view safe zones" ON safe_zones;
CREATE POLICY "Anyone can view safe zones"
  ON safe_zones FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view safe zones" ON safe_zones;
CREATE POLICY "Public can view safe zones"
  ON safe_zones FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_location_shares_user_id ON location_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_location_shares_active ON location_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_community_reports_severity ON community_reports(severity);
CREATE INDEX IF NOT EXISTS idx_safe_zones_type ON safe_zones(type);

-- =====================================================
-- CREATE STORAGE BUCKET FOR PROFILE PICTURES
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;
CREATE POLICY "Users can upload own profile pictures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
CREATE POLICY "Users can update own profile pictures"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects;
CREATE POLICY "Users can delete own profile pictures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- SEED DATA - SAFE ZONES
-- =====================================================

INSERT INTO safe_zones (name, type, latitude, longitude, phone_number) VALUES
('Central Police Station', 'police_station', 40.7580, -73.9855, '+1 212-555-0101'),
('Downtown Police Precinct', 'police_station', 40.7489, -73.9680, '+1 212-555-0102'),
('North Side Police Station', 'police_station', 40.7789, -73.9534, '+1 212-555-0103'),
('City General Hospital', 'hospital', 40.7614, -73.9776, '+1 212-555-0201'),
('Memorial Medical Center', 'hospital', 40.7489, -73.9920, '+1 212-555-0202'),
('St. Mary Hospital', 'hospital', 40.7714, -73.9570, '+1 212-555-0203'),
('Safe Haven Shelter', 'safe_house', 40.7589, -73.9851, '+1 212-555-0301'),
('Women Support Center', 'safe_house', 40.7514, -73.9789, '+1 212-555-0302'),
('Community Safe House', 'safe_house', 40.7689, -73.9623, '+1 212-555-0303'),
('Emergency Care Hospital', 'hospital', 40.7414, -73.9889, '+1 212-555-0204')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify setup
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT 'Safe zones seeded:' as status;
SELECT COUNT(*) as safe_zone_count FROM safe_zones;

SELECT 'Setup complete!' as status;
```

### After Running the SQL

1. **Verify Tables Created**: You should see 6 tables in the output:
   - community_reports
   - emergency_contacts
   - location_shares
   - profiles
   - safe_zones
   - sos_alerts

2. **Check Safe Zones**: Should show 10 safe zones created

3. **Restart Your Dev Server**:
   ```bash
   # The dev server will automatically pick up the new .env values
   ```

### Option 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref bjqdwnnjqxpmrnuhbszs

# Run the migration (if you have the SQL file)
supabase db push
```

## What's Set Up

### Tables
1. **profiles** - User profile information
2. **emergency_contacts** - Emergency contact list
3. **sos_alerts** - SOS emergency alerts
4. **location_shares** - Real-time location sharing
5. **community_reports** - Incident reports
6. **safe_zones** - Police stations, hospitals, safe houses

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Public read access for safe zones and community reports
- Profile pictures storage with proper access control

### Data
- 10 safe zones (3 police stations, 4 hospitals, 3 safe houses)
- All in the New York City area for demo purposes

## Customizing Safe Zones

To add your own safe zones for your city:

1. Go to SQL Editor in Supabase
2. Run this query with your locations:

```sql
INSERT INTO safe_zones (name, type, latitude, longitude, phone_number) VALUES
('Your Police Station', 'police_station', YOUR_LAT, YOUR_LON, 'PHONE'),
('Your Hospital', 'hospital', YOUR_LAT, YOUR_LON, 'PHONE')
-- Add more as needed
;
```

## Troubleshooting

### "relation does not exist" error
- Run the complete SQL setup script above
- Make sure you're in the correct project

### "permission denied" error
- RLS policies are working correctly
- Make sure you're signed in to the app
- Check that your auth token is valid

### Profile not creating on signup
- The profiles table and RLS policies must be set up
- Check browser console for errors

## Next Steps

1. Run the SQL setup script in Supabase SQL Editor
2. Restart your development server
3. Create a test account by signing up
4. Start using the app!

Your app will now use your own Supabase database with all data stored in your account.
