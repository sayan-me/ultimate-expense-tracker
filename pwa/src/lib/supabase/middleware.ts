import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Refreshes the Supabase auth session cookie on every request (called from
 * the root middleware.ts). Without this, a session near expiry would only
 * get refreshed on a Server Component read, which is too late for a
 * middleware-based route guard checked before that render happens.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Touching getUser() is what actually triggers the refresh — do not
    // remove this call or skip it, even though its result isn't used here.
    await supabase.auth.getUser()

    return supabaseResponse
}
