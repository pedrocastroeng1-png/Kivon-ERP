import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function list() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log("Buckets:", data?.map(b => ({id: b.id, name: b.name, public: b.public})), error);
}
list();
