import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Trying without spaces:");
  let res = await sb.auth.signInWithPassword({ email: 'stylostottus@gmail.com', password: 'Stylostottus123.' });
  console.log(res.error ? res.error.message : "Success!");

  console.log("Trying with leading spaces (password):");
  res = await sb.auth.signInWithPassword({ email: 'stylostottus@gmail.com', password: '  Stylostottus123.' });
  console.log(res.error ? res.error.message : "Success!");
  
  console.log("Trying with leading spaces (email & password):");
  res = await sb.auth.signInWithPassword({ email: ' stylostottus@gmail.com', password: '  Stylostottus123.' });
  console.log(res.error ? res.error.message : "Success!");
}
run();
