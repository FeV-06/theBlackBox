import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/googleOAuth";
import {
    getValidAccessTokenOrRefresh,
    applyRefreshedCookies,
} from "@/lib/googleSession";

/**
 * GET /api/google/gmail/summary
 * Returns unread count and last 5 email subjects.
 */
export async function GET() {
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
        const client = getOAuthClient({ access_token: auth.accessToken });
        const gmail = google.gmail({ version: "v1", auth: client });

        // Get unread count
        const { data: unreadList } = await gmail.users.messages.list({
            userId: "me",
            q: "is:unread",
            maxResults: 1,
        });
        const unreadCount = unreadList.resultSizeEstimate ?? 0;

        // Get last 5 messages (any, not just unread) for subjects
        const { data: msgList } = await gmail.users.messages.list({
            userId: "me",
            maxResults: 5,
        });

        const messageIds = (msgList.messages ?? []).map((m) => m.id!);
        const last5Subjects: string[] = [];

        for (const msgId of messageIds) {
            const { data: msg } = await gmail.users.messages.get({
                userId: "me",
                id: msgId,
                format: "metadata",
                metadataHeaders: ["Subject"],
            });

            const subjectHeader = (msg.payload?.headers ?? []).find(
                (h) => h.name === "Subject"
            );
            last5Subjects.push(subjectHeader?.value ?? "(no subject)");
        }

        const res = NextResponse.json({ unreadCount, last5Subjects });
        return applyRefreshedCookies(res, auth.newTokens);
    } catch (error) {
        console.error("[Gmail] Summary error:", error);
        return NextResponse.json({ error: "Failed to fetch Gmail summary" }, { status: 500 });
    }
}
