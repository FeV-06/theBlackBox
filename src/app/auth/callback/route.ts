import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { setGoogleCookies } from "@/lib/googleSession";

/**
 * Supabase Auth Callback Route
 *
 * After Supabase handles the Google OAuth redirect, it sends the user here
 * with a `code` param. We exchange that for a session, extract the Google
 * provider tokens (access_token, refresh_token), inject them into the
 * existing tbb_google_* HTTPOnly cookies, and also persist them to the
 * `google_tokens` Supabase table for redundancy (Android / expiry fallback).
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (!code) {
        return NextResponse.redirect(`${origin}/auth/error?message=missing_code`);
    }

    let response = NextResponse.redirect(`${origin}${next}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase environment variables in Auth Callback");
        return NextResponse.redirect(`${origin}/auth/error?message=missing_config`);
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
        console.error("[Auth Callback] Session exchange failed:", error?.message);
        return NextResponse.redirect(
            `${origin}/auth/error?message=session_failed`
        );
    }

    const { session } = data;

    // --- Hybrid Token Extraction ---
    // Supabase returns Google's provider_token and provider_refresh_token
    // when the `offline` access_type is requested during sign-in.
    // We persist these so that existing Google API routes continue to work.
    const providerToken = session.provider_token;
    const providerRefreshToken = session.provider_refresh_token;

    if (providerToken) {
        // 1. Inject into existing HTTPOnly cookies (backwards-compat with existing API routes)
        response = setGoogleCookies(
            response as unknown as import("next/server").NextResponse,
            {
                access_token: providerToken,
                refresh_token: providerRefreshToken ?? null,
                expiry_date: session.expires_at
                    ? session.expires_at * 1000
                    : null,
            },
            session.user.user_metadata
                ? {
                    name: session.user.user_metadata.full_name ?? "",
                    email: session.user.email ?? "",
                    picture: session.user.user_metadata.avatar_url ?? "",
                }
                : undefined
        ) as unknown as NextResponse;

        // 2. Persist to DB for Android / cookie-expiry fallback
        if (providerRefreshToken) {
            await supabase.from("google_tokens").upsert(
                {
                    user_id: session.user.id,
                    access_token: providerToken,
                    refresh_token: providerRefreshToken,
                    expiry: session.expires_at
                        ? new Date(session.expires_at * 1000).toISOString()
                        : null,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            );
        }
    }

    return response;
}
