import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser-side Supabase client. Uses the anon/public key only — never the
 * service_role key, which must stay server-only (see backend/services/
 * user-service, the only place that key belongs).
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
