import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function query() {
  const { data, error } = await supabase.from('presence_photos').select('*').limit(5);
  console.log("Photos in table:", data, error);
}
query();
