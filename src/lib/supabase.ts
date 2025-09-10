import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// DEPRECATED: This file is deprecated in favor of src/integrations/supabase/client.ts
// Keeping for backward compatibility but using centralized configuration
const supabaseUrl = config.supabase.url;
const supabaseAnonKey = config.supabase.anonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Make sure Supabase is properly connected.');
  // Create a dummy client to prevent runtime errors
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