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
 * Returns full timezone info for each event.
 */
export async function GET(request: NextRequest) {
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const client = getOAuthClient({ access_token: auth.accessToken });
        const calendar = google.calendar({ version: "v3", auth: client });

        const url = new URL(request.url);
        const paramMin = url.searchParams.get("timeMin");
        const paramMax = url.searchParams.get("timeMax");

        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 30);

        const timeMin = paramMin || now.toISOString();
        const timeMax = paramMax || future.toISOString();

        const { data } = await calendar.events.list({
            calendarId: "primary",
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 250,
        });

        const calendarTz = data.timeZone ?? "UTC";

        const events = (data.items ?? []).map((e) => ({
            id: e.id,
            summary: e.summary ?? "",
            description: e.description ?? "",
            start: e.start?.dateTime ?? e.start?.date ?? "",
            end: e.end?.dateTime ?? e.end?.date ?? "",
            startTimeZone: e.start?.timeZone ?? calendarTz,
            endTimeZone: e.end?.timeZone ?? calendarTz,
            colorId: e.colorId ?? undefined,
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
 * Body: { summary, description?, start, end, timeZone }
 * start/end should be ISO datetime strings WITH offset.
 * timeZone is the IANA timezone (e.g. "Asia/Kolkata").
 */
export async function POST(request: NextRequest) {
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { summary, description, start, end, timeZone, colorId } = body;

        if (!summary || !start || !end) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const tz = timeZone || "UTC";
        const client = getOAuthClient({ access_token: auth.accessToken });
        const calendar = google.calendar({ version: "v3", auth: client });

        const { data } = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary,
                description: description ?? "",
                start: { dateTime: start, timeZone: tz },
                end: { dateTime: end, timeZone: tz },
                ...(colorId ? { colorId } : {}),
            },
        });

        const res = NextResponse.json({
            event: {
                id: data.id,
                summary: data.summary ?? "",
                description: data.description ?? "",
                start: data.start?.dateTime ?? data.start?.date ?? "",
                end: data.end?.dateTime ?? data.end?.date ?? "",
                startTimeZone: data.start?.timeZone ?? tz,
                endTimeZone: data.end?.timeZone ?? tz,
                colorId: data.colorId ?? undefined,
            },
        });
        return applyRefreshedCookies(res, auth.newTokens);
    } catch (error) {
        console.error("[Calendar] Create error:", error);
        return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }
}
