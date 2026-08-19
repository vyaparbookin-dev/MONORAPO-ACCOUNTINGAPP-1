import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://yqinyfcgyoghkulndpli.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_o1A6O3AQeUe70nk10UcH8w_BcbicIxa";

// Admin / Service-Role Supabase Client (bypasses RLS for backend operations)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public / Anon Client (uses RLS)
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get client scoped to a user's JWT
export const getSupabaseClientForUser = (userJwt) => {
  if (!userJwt) return supabase;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${userJwt}`,
      },
    },
  });
};

export default supabase;
