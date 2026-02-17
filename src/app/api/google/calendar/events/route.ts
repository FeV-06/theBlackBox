import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/googleOAuth";
import {
    getValidAccessTokenOrRefresh,
    applyRefreshedCookies,
} from "@/lib/googleSession";

/**
 * GET /api/google/calendar/events
 * List calendar events for the next 30 days.
 */
export async function GET() {
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const client = getOAuthClient({ access_token: auth.accessToken });
        const calendar = google.calendar({ version: "v3", auth: client });

        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 30);

        const { data } = await calendar.events.list({
            calendarId: "primary",
            timeMin: now.toISOString(),
            timeMax: future.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 100,
        });

        const events = (data.items ?? []).map((e) => ({
            id: e.id,
            summary: e.summary ?? "",
            description: e.description ?? "",
            start: e.start?.dateTime ?? e.start?.date ?? "",
            end: e.end?.dateTime ?? e.end?.date ?? "",
            htmlLink: e.htmlLink ?? "",
        }));

        const res = NextResponse.json({ events });
        return applyRefreshedCookies(res, auth.newTokens);
    } catch (error) {
        console.error("[Calendar] List error:", error);
        return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }
}

/**
 * POST /api/google/calendar/events
 * Create a new calendar event.
 * Body: { summary, description?, start, end }
 * start/end are ISO datetime strings.
 */
export async function POST(request: NextRequest) {
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { summary, description, start, end } = body;

        if (!summary || !start || !end) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const client = getOAuthClient({ access_token: auth.accessToken });
        const calendar = google.calendar({ version: "v3", auth: client });

        const { data } = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary,
                description: description ?? "",
                start: { dateTime: start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
                end: { dateTime: end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            },
        });

        const res = NextResponse.json({
            event: {
                id: data.id,
                summary: data.summary ?? "",
                description: data.description ?? "",
                start: data.start?.dateTime ?? data.start?.date ?? "",
                end: data.end?.dateTime ?? data.end?.date ?? "",
            },
        });
        return applyRefreshedCookies(res, auth.newTokens);
    } catch (error) {
        console.error("[Calendar] Create error:", error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
