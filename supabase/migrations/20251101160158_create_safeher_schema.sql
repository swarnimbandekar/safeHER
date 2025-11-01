/*
  # safeHER Database Schema - Complete Setup
  
  ## Overview
  This migration creates the complete database schema for the safeHER women's safety application.
  
  ## New Tables
  
  ### 1. profiles
  - `id` (uuid, primary key) - References auth.users
  - `full_name` (text) - User's full name
  - `phone_number` (text) - Contact phone number
  - `profile_picture_url` (text, nullable) - URL to profile picture in storage
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 2. emergency_contacts
  - `id` (uuid, primary key) - Unique contact identifier
  - `user_id` (uuid) - References profiles(id)
  - `name` (text) - Contact name
  - `phone_number` (text) - Contact phone
  - `relationship` (text) - Relationship to user
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 3. sos_alerts
  - `id` (uuid, primary key) - Unique alert identifier
  - `user_id` (uuid) - References profiles(id)
  - `latitude` (float8) - Alert location latitude
  - `longitude` (float8) - Alert location longitude
  - `message` (text) - Alert message
  - `status` (text) - Alert status: 'active' or 'resolved'
  - `created_at` (timestamptz) - Alert creation timestamp
  
  ### 4. location_shares
  - `id` (uuid, primary key) - Unique share identifier
  - `user_id` (uuid) - References profiles(id)
  - `latitude` (float8) - Current latitude
  - `longitude` (float8) - Current longitude
  - `is_active` (boolean) - Sharing status
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 5. community_reports
  - `id` (uuid, primary key) - Unique report identifier
  - `user_id` (uuid, nullable) - References profiles(id), null for anonymous
  - `latitude` (float8) - Incident location latitude
  - `longitude` (float8) - Incident location longitude
  - `incident_type` (text) - Type: 'harassment', 'unsafe_area', 'suspicious_activity', 'other'
  - `description` (text) - Incident description
  - `severity` (text) - Severity: 'low', 'medium', 'high'
  - `created_at` (timestamptz) - Report creation timestamp
  
  ### 6. safe_zones
  - `id` (uuid, primary key) - Unique zone identifier
  - `name` (text) - Zone name
  - `type` (text) - Type: 'police_station', 'hospital', 'safe_house'
  - `latitude` (float8) - Zone location latitude
  - `longitude` (float8) - Zone location longitude
  - `phone_number` (text, nullable) - Contact phone number
  - `created_at` (timestamptz) - Record creation timestamp
  
  ## Security
  
  ### Row Level Security (RLS)
  All tables have RLS enabled with appropriate policies:
  
  - **profiles**: Users can read and update their own profile
  - **emergency_contacts**: Users can manage their own contacts
  - **sos_alerts**: Users can create alerts; emergency contacts can read them
  - **location_shares**: Users can update their location; emergency contacts can read
  - **community_reports**: Public read; authenticated users can create
  - **safe_zones**: Public read access for all users
  
  ## Storage
  
  Creates a storage bucket for profile pictures with public access.
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_number text NOT NULL,
  profile_picture_url text,
  created_at timestamptz DEFAULT now()
);

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  relationship text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sos_alerts table
CREATE TABLE IF NOT EXISTS sos_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at timestamptz DEFAULT now()
);

-- Create location_shares table
CREATE TABLE IF NOT EXISTS location_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  is_active boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create community_reports table
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

-- Create safe_zones table
CREATE TABLE IF NOT EXISTS safe_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('police_station', 'hospital', 'safe_house')),
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_zones ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Emergency contacts policies
CREATE POLICY "Users can view own contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contacts"
  ON emergency_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON emergency_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts"
  ON emergency_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- SOS alerts policies
CREATE POLICY "Users can create own alerts"
  ON sos_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own alerts"
  ON sos_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON sos_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Emergency contacts can view alerts"
  ON sos_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emergency_contacts
      WHERE emergency_contacts.user_id = sos_alerts.user_id
      AND emergency_contacts.phone_number IN (
        SELECT phone_number FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Location shares policies
CREATE POLICY "Users can manage own location"
  ON location_shares FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Emergency contacts can view shared locations"
  ON location_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emergency_contacts
      WHERE emergency_contacts.user_id = location_shares.user_id
      AND emergency_contacts.phone_number IN (
        SELECT phone_number FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Community reports policies
CREATE POLICY "Anyone can view reports"
  ON community_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON community_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Safe zones policies
CREATE POLICY "Anyone can view safe zones"
  ON safe_zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view safe zones"
  ON safe_zones FOR SELECT
  TO anon
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_location_shares_user_id ON location_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_location_shares_active ON location_shares(is_active);
CREATE INDEX IF NOT EXISTS idx_community_reports_severity ON community_reports(severity);
CREATE INDEX IF NOT EXISTS idx_safe_zones_type ON safe_zones(type);

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile pictures
CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload own profile pictures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own profile pictures"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own profile pictures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );