import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function listFiles() {
  const { data, error } = await supabase.from('presence_photos').select('*').limit(1);
  console.log("DB Record:", data, error);
}
listFiles();
