import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  full_name: string;
  phone_number: string;
  profile_picture_url: string | null;
  created_at: string;
};

export type EmergencyContact = {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string;
  created_at: string;
};

export type SOSAlert = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  message: string;
  status: 'active' | 'resolved';
  created_at: string;
};

export type LocationShare = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  updated_at: string;
};

export type CommunityReport = {
  id: string;
  user_id: string | null;
  latitude: number;
  longitude: number;
  incident_type: 'harassment' | 'unsafe_area' | 'suspicious_activity' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  created_at: string;
};

export type SafeZone = {
  id: string;
  name: string;
  type: 'police_station' | 'hospital' | 'safe_house';
  latitude: number;
  longitude: number;
  phone_number: string | null;
  created_at: string;
};
