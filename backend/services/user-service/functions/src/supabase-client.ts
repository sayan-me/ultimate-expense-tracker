import {createClient} from "@supabase/supabase-js";

// Shared across index.ts (existing user/auth handlers) and sync.ts (new
// cloud-sync handlers) so there's exactly one lazy-initialized client and
// one place reading the service-role env vars.
let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase configuration not found. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return supabase;
}

/** Test-only: clears the cached client so each test's mock takes effect instead of a stale one from an earlier test. */
export function __resetSupabaseClientForTests() {
  supabase = null;
}
