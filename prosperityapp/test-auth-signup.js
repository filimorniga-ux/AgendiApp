import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Signing up user...");
  const { data, error } = await sb.auth.signUp({
    email: 'stylostottus@gmail.com',
    password: 'Stylostottus123.',
  });
  
  if (error) {
    console.error("SignUp Error:", error.message);
  } else {
    console.log("SignUp Success!");
    if (data.session) {
      console.log("User is immediately signed in!");
    } else {
      console.log("User created, but email confirmation might be required.", data.user?.id);
    }
  }
}
run();
