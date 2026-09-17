import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";

export function getServerSupabase(): { client: SupabaseClient | null; error: string | null } {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      client: null,
      error: "Server data access is not configured. Add the required server environment variables.",
    };
  }

  return {
    client: createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    }),
    error: null,
  };
}
