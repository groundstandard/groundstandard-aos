import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'admin';
  parent_id?: string;
  phone?: string;
  emergency_contact?: string;
  belt_level?: string;
  membership_status: 'active' | 'inactive' | 'alumni';
  created_at: string;
  updated_at: string;
};