import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.storage.getBucket('presence-photos');
  console.log("Bucket info:", data, error);

  // Let's list some files
  const { data: files, error: filesError } = await supabase.storage.from('presence-photos').list('');
  console.log("Files:", files, filesError);
}

check();
