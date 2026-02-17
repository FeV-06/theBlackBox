import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/googleOAuth";
import {
    getValidAccessTokenOrRefresh,
    applyRefreshedCookies,
} from "@/lib/googleSession";

/**
 * GET /api/google/calendar/colors
 * Fetch the Google Calendar color palette.
 * Returns event and calendar color maps from Google's API.
 */
export async function GET() {
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const client = getOAuthClient({ access_token: auth.accessToken });
        const calendar = google.calendar({ version: "v3", auth: client });

        const { data } = await calendar.colors.get();

        const res = NextResponse.json({
            event: data.event ?? {},
            calendar: data.calendar ?? {},
        });
        return applyRefreshedCookies(res, auth.newTokens);
    } catch (error) {
        console.error("[Calendar] Colors error:", error);
        return NextResponse.json({ error: "Failed to fetch colors" }, { status: 500 });
    }
}
