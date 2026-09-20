import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

async function insertSupaHardwareSales() {
  const { data: companies } = await supabase.from('companies').select('id, name');
  console.log("Companies in Supabase:", companies);

  const targetCoId = companies?.[0]?.id;
  if (!targetCoId) {
    console.error("No company found in Supabase");
    return;
  }

  const now = new Date();
  const supaSales = [
    {
      company_id: targetCoId,
      bill_number: "BILL-HW-1001",
      customer_name: "काउंटर नकद ग्राहक (दैनिक बिक्री)",
      customer_mobile: "9876543210",
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      final_amount: 5000,
      sub_total: 5000,
      tax_amount: 0,
      discount_amount: 0,
      amount_received: 5000,
      payment_status: "paid",
      payment_method: "Cash",
      status: "complete",
      items: [{ name: "हार्डवेयर एवं पेंट सामान", quantity: 1, rate: 5000, total: 5000 }],
      notes: "दैनिक बिक्री काउंटर नकद (Direct Sale)",
      is_deleted: false,
      created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      company_id: targetCoId,
      bill_number: "BILL-HW-1002",
      customer_name: "काउंटर नकद ग्राहक (दैनिक बिक्री)",
      customer_mobile: "9876543210",
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      final_amount: 5000,
      sub_total: 5000,
      tax_amount: 0,
      discount_amount: 0,
      amount_received: 5000,
      payment_status: "paid",
      payment_method: "Cash",
      status: "complete",
      items: [{ name: "हार्डवेयर सामान", quantity: 1, rate: 5000, total: 5000 }],
      notes: "दैनिक बिक्री काउंटर नकद (Direct Sale)",
      is_deleted: false,
      created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      company_id: targetCoId,
      bill_number: "BILL-HW-1003",
      customer_name: "काउंटर नकद ग्राहक (दैनिक बिक्री)",
      customer_mobile: "9876543210",
      date: new Date().toISOString(),
      final_amount: 5000,
      sub_total: 5000,
      tax_amount: 0,
      discount_amount: 0,
      amount_received: 5000,
      payment_status: "paid",
      payment_method: "Cash",
      status: "complete",
      items: [{ name: "हार्डवेयर एवं सेनेटरी सामान", quantity: 1, rate: 5000, total: 5000 }],
      notes: "दैनिक बिक्री काउंटर नकद (Direct Sale)",
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const { error } = await supabase.from('sales').insert(supaSales);
  if (error) {
    console.error("Supabase insert error:", error.message);
  } else {
    console.log("✅ Successfully inserted 3 Hardware sales of ₹5,000 into Supabase!");
  }
}

insertSupaHardwareSales().catch(console.error);
