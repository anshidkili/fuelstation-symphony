
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qkqgqkkcwskkvnopplud.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcWdxa2tjd3Nra3Zub3BwbHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2MjYwNjcsImV4cCI6MjA1ODIwMjA2N30.7BFYt3KgNjkXjpfUV9tpWvrB8hH9320ZM0MMRSQfmhw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'fs_auth',
  },
});
