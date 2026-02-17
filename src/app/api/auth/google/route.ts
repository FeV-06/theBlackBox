import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/googleOAuth";

/**
 * GET /api/auth/google
 * Redirects the user to Google's OAuth consent screen.
 */
export async function GET() {
    try {
        const url = getAuthUrl();
        return NextResponse.redirect(url);
    } catch (error) {
        console.error("[OAuth] Failed to generate auth URL:", error);
        return NextResponse.json(
            { error: "Failed to start OAuth flow" },
            { status: 500 }
        );
    }
}
