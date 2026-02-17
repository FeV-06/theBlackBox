import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshAccessToken } from "./googleOAuth";

// ⚠️ SECURITY NOTE (v1):
// Tokens are stored in HttpOnly Secure cookies, never in localStorage.
// This is safe for personal use. For multi-user production, use an encrypted
// session store or a database-backed token vault.

const COOKIE_ACCESS = "tbb_google_access_token";
const COOKIE_REFRESH = "tbb_google_refresh_token";
const COOKIE_EXPIRY = "tbb_google_expiry";
const COOKIE_PROFILE = "tbb_google_profile";

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
});

/* ─── Read tokens from request cookies ─── */
export async function getGoogleTokensFromCookies() {
    const jar = await cookies();
    const accessToken = jar.get(COOKIE_ACCESS)?.value ?? null;
    const refreshToken = jar.get(COOKIE_REFRESH)?.value ?? null;
    const expiryStr = jar.get(COOKIE_EXPIRY)?.value ?? null;
    const expiryDate = expiryStr ? Number(expiryStr) : null;
    return { accessToken, refreshToken, expiryDate };
}

/* ─── Read cached profile from cookies ─── */
export async function getProfileFromCookies(): Promise<{
    name: string; email: string; picture: string;
} | null> {
    const jar = await cookies();
    const raw = jar.get(COOKIE_PROFILE)?.value ?? null;
    if (!raw) return null;
    try {
        return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    } catch {
        return null;
    }
}

/* ─── Set cookies on a NextResponse ─── */
export function setGoogleCookies(
    res: NextResponse,
    tokens: {
        access_token?: string | null;
        refresh_token?: string | null;
        expiry_date?: number | null;
    },
    profile?: { name: string; email: string; picture: string }
) {
    const opts = cookieOptions();
    const maxAge = 60 * 60 * 24 * 30;  // 30 days

    if (tokens.access_token) {
        res.cookies.set(COOKIE_ACCESS, tokens.access_token, { ...opts, maxAge });
    }
    if (tokens.refresh_token) {
        res.cookies.set(COOKIE_REFRESH, tokens.refresh_token, { ...opts, maxAge: 60 * 60 * 24 * 365 }); // 1 year
    }
    if (tokens.expiry_date) {
        res.cookies.set(COOKIE_EXPIRY, String(tokens.expiry_date), { ...opts, maxAge });
    }
    if (profile) {
        const encoded = Buffer.from(JSON.stringify(profile)).toString("base64");
        res.cookies.set(COOKIE_PROFILE, encoded, { ...opts, maxAge });
    }
    return res;
}

/* ─── Clear all Google cookies ─── */
export function clearGoogleCookies(res: NextResponse) {
    const opts = cookieOptions();
    for (const name of [COOKIE_ACCESS, COOKIE_REFRESH, COOKIE_EXPIRY, COOKIE_PROFILE]) {
        res.cookies.set(name, "", { ...opts, maxAge: 0 });
    }
    return res;
}

/* ─── Get a valid access token, refreshing if expired ─── */
export async function getValidAccessTokenOrRefresh(): Promise<{
    accessToken: string;
    newTokens?: {
        access_token: string;
        expiry_date: number;
    };
} | null> {
    const { accessToken, refreshToken, expiryDate } = await getGoogleTokensFromCookies();

    if (!accessToken || !refreshToken) return null;

    // Still valid? (5-minute buffer)
    const isExpired = expiryDate ? Date.now() > expiryDate - 5 * 60 * 1000 : false;

    if (!isExpired) {
        return { accessToken };
    }

    // Refresh
    try {
        const credentials = await refreshAccessToken(refreshToken);
        if (!credentials.access_token) return null;
        return {
            accessToken: credentials.access_token,
            newTokens: {
                access_token: credentials.access_token,
                expiry_date: credentials.expiry_date ?? Date.now() + 3600 * 1000,
            },
        };
    } catch {
        return null;
    }
}

/**
 * Helper: Apply refreshed cookie headers to any NextResponse if tokens were refreshed.
 */
export function applyRefreshedCookies(
    res: NextResponse,
    newTokens?: { access_token: string; expiry_date: number }
) {
    if (newTokens) {
        setGoogleCookies(res, {
            access_token: newTokens.access_token,
            expiry_date: newTokens.expiry_date,
        });
    }
    return res;
}
