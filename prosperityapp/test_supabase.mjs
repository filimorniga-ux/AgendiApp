import { createClient } from './node_modules/@supabase/supabase-js/dist/main/index.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if(!supabaseUrl || !supabaseKey) {
  console.log("Missing env vars", supabaseUrl, supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('fetch_table_with_business_id', {
    p_table: 'retail_inventory',
    p_business_id: 'filimorniga-ux'
  });
  console.log('retail_inventory data count:', data?.length);
  console.log('retail_inventory error:', error?.message || 'none');
  
  const { data: d2, error: e2 } = await supabase.from('movements').insert([
    {business_id: 'filimorniga-ux', type: 'Test', date: new Date().toISOString(), transaction_id: 'dev_test'}
  ]);
  console.log('insert error:', e2?.message || 'none');
  
  // also try simple select
  const { data: d3, error: e3 } = await supabase.from('movements').select('*').eq('business_id', 'filimorniga-ux').limit(1);
  console.log('select movements error:', e3?.message || 'none');
}

test();
