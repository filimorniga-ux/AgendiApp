import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("INITIALIZING SUPABASE WITH URL:", JSON.stringify(supabaseUrl), "KEY LENGTH:", supabaseAnonKey?.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
