import { createClient } from '@supabase/supabase-js';

// Access environment variables safely to avoid crashes if not running in Vite
// or if the environment variables are not loaded yet.
const env: any = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Only create the client if keys are present
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;