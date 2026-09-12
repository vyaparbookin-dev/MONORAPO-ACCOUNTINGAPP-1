import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const isConfigured = Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export const supabaseAnon = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey)
  : null;

export const getSupabaseClientForUser = (userJwt) => {
  if (!isConfigured) return null;
  if (!userJwt) return supabase;
  return createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
    global: {
      headers: {
        Authorization: `Bearer ${userJwt}`,
      },
    },
  });
};

export default supabase;
