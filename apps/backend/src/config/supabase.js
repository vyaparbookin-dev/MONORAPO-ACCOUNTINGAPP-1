import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env explicitly from apps/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Also load default if present

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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
