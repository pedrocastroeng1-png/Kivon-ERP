import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Usually anon key cannot list buckets. Let's see if there's a service_role key
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  supabase.storage.listBuckets().then(({data}) => console.log("Buckets:", data?.map(b => b.name)));
} else {
  console.log("No service role key found.");
}
