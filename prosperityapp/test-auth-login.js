import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Logging in user...");
  const { data, error } = await sb.auth.signInWithPassword({
    email: 'stylostottus@gmail.com',
    password: 'Stylostottus123.',
  });
  
  if (error) {
    console.error("Login Error:", error.message);
  } else {
    console.log("Login Success!", data.user?.id);
  }
}
run();
