import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/googleOAuth";

/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth consent screen.
 * The redirect URI is derived from the incoming request's host so that
 * mobile devices on the LAN (using the machine's IP) are handled correctly.
 */
export async function GET(request: NextRequest) {
    try {
        // Build the redirect URI from the actual host making the request
        // so it works whether the user hits localhost or 192.168.x.x etc.
        const host = request.headers.get("host") ?? "localhost:3000";
        const protocol = host.startsWith("localhost") ? "http" : "https";
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

        const url = getAuthUrl(redirectUri);
        return NextResponse.redirect(url);
    } catch (error) {
        console.error("[OAuth] Failed to generate auth URL:", error);
        return NextResponse.json(
            { error: "Failed to start OAuth flow" },
            { status: 500 }
        );
    }
}
