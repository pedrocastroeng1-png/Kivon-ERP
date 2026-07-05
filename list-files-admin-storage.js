import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function checkStorage() {
  const { data, error } = await supabase.storage.from('presence-photos').list('68ad6550-aa8c-44d9-9381-6c04ffa1970d/employees/6634a017-7462-432e-b881-6d7dfaa879ad/2026-07-04/');
  console.log("Storage file:", data, error);
}
checkStorage();
