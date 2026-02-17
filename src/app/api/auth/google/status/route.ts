import { NextResponse } from "next/server";
import {
    getGoogleTokensFromCookies,
    getProfileFromCookies,
} from "@/lib/googleSession";

/**
 * GET /api/auth/google/status
 * Returns connection status and cached profile from cookies.
 * Tokens are never sent to the frontend.
 */
export async function GET() {
    const { accessToken } = await getGoogleTokensFromCookies();
    const profile = await getProfileFromCookies();

    if (!accessToken) {
        return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
        connected: true,
        profile: profile ?? { name: "", email: "", picture: "" },
    });
}
