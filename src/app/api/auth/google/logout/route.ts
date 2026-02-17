import { NextResponse } from "next/server";
import { clearGoogleCookies } from "@/lib/googleSession";

/**
 * POST /api/auth/google/logout
 * Clears all Google auth cookies.
 */
export async function POST() {
    const res = NextResponse.json({ success: true });
    clearGoogleCookies(res);
    return res;
}
