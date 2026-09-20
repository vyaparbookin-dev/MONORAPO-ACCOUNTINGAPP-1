import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function checkAllSales() {
  const { data, error, count } = await supabase.from('sales').select('*', { count: 'exact' });
  console.log("Supabase Total sales count:", count);
  if (data) {
    console.log("Sales data summary:", data.map(s => ({
      id: s.id,
      bill_number: s.bill_number,
      final_amount: s.final_amount,
      sub_total: s.sub_total,
      date: s.date,
      customer_name: s.customer_name,
      company_id: s.company_id
    })));
  }
}

checkAllSales().catch(console.error);
