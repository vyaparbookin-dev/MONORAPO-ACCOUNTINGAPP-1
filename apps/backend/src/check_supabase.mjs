import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log("Connecting to Supabase:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabase() {
  const tables = ['bills', 'sales', 'party_transactions', 'partytransactions', 'parties', 'expenses', 'products', 'companies'];
  for (const t of tables) {
    try {
      const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: false }).limit(5);
      if (error) {
        console.log(`Table [${t}]: Error or does not exist (${error.message})`);
      } else {
        console.log(`Table [${t}]: Found ${data?.length} rows (Sample:`, JSON.stringify(data?.[0] || {}, null, 2), `)`);
      }
    } catch (e) {
      console.log(`Table [${t}]: Exception ${e.message}`);
    }
  }

  // Also query schema table list via rpc or postgres information schema if allowed
  const { data: info, error: infoErr } = await supabase.rpc('get_tables').catch(() => ({ data: null }));
  if (info) console.log("Supabase RPC tables:", info);
}

checkSupabase().catch(console.error);
