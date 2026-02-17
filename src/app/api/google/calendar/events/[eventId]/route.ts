import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/googleOAuth";
import {
    getValidAccessTokenOrRefresh,
    applyRefreshedCookies,
} from "@/lib/googleSession";

/**
 * PUT /api/google/calendar/events/[eventId]
 * Update an existing calendar event.
 * Body: { summary?, description?, start?, end? }
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const client = getOAuthClient({ access_token: auth.accessToken });
        const calendar = google.calendar({ version: "v3", auth: client });

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const requestBody: Record<string, unknown> = {};
        if (body.summary !== undefined) requestBody.summary = body.summary;
        if (body.description !== undefined) requestBody.description = body.description;
        if (body.start) requestBody.start = { dateTime: body.start, timeZone: tz };
        if (body.end) requestBody.end = { dateTime: body.end, timeZone: tz };

        const { data } = await calendar.events.patch({
            calendarId: "primary",
            eventId,
            requestBody,
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
        console.error("[Calendar] Update error:", error);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}

/**
 * DELETE /api/google/calendar/events/[eventId]
 * Delete a calendar event.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    const { eventId } = await params;
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const client = getOAuthClient({ access_token: auth.accessToken });
        const calendar = google.calendar({ version: "v3", auth: client });

        await calendar.events.delete({
            calendarId: "primary",
            eventId,
        });

        const res = NextResponse.json({ success: true });
        return applyRefreshedCookies(res, auth.newTokens);
    } catch (error) {
        console.error("[Calendar] Delete error:", error);
        return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }
}
