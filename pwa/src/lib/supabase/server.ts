import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Server-side Supabase client for Server Components/Actions/Route Handlers.
 * Still uses only the anon key — RLS policies (not this client) are what
 * actually restrict access per-user, based on the session cookie.
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Called from a Server Component, which can't set
                        // cookies — harmless as long as middleware.ts is
                        // refreshing the session on every request.
                    }
                },
            },
        }
    )
}
