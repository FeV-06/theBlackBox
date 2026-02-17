import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/googleOAuth";
import {
    getValidAccessTokenOrRefresh,
    applyRefreshedCookies,
} from "@/lib/googleSession";
import type {
    GmailMode,
    GmailMailbox,
    GmailStatus,
    GmailCategory,
} from "@/types/gmail";

/* ── Gmail query mapping (exact Gmail API q= syntax) ── */

const MAILBOX_QUERY: Record<GmailMailbox, string> = {
    inbox: "in:inbox",
    sent: "in:sent",
    drafts: "in:drafts",
    spam: "in:spam",
    trash: "in:trash",
    starred: "is:starred",
    important: "is:important",
    all: "",
};

const STATUS_QUERY: Record<GmailStatus, string> = {
    all: "",
    unread: "is:unread",
    read: "is:read",
};

const CATEGORY_QUERY: Record<GmailCategory, string> = {
    all: "",
    primary: "category:primary",
    promotions: "category:promotions",
    social: "category:social",
    updates: "category:updates",
    forums: "category:forums",
};

const VALID_MAILBOXES = new Set<string>(Object.keys(MAILBOX_QUERY));
const VALID_STATUSES = new Set<string>(Object.keys(STATUS_QUERY));
const VALID_CATEGORIES = new Set<string>(Object.keys(CATEGORY_QUERY));

function buildBasicQuery(mailbox: GmailMailbox, status: GmailStatus, category: GmailCategory): string {
    return [MAILBOX_QUERY[mailbox], STATUS_QUERY[status], CATEGORY_QUERY[category]]
        .filter(Boolean)
        .join(" ");
}

function buildBasicUnreadQuery(mailbox: GmailMailbox, category: GmailCategory): string {
    return [MAILBOX_QUERY[mailbox], "is:unread", CATEGORY_QUERY[category]]
        .filter(Boolean)
        .join(" ");
}

const PAGE_SIZE = 50;

/**
 * GET /api/google/gmail/summary
 * Supports basic filter mode and advanced query mode.
 * Always returns up to 50 messages per page. Supports pagination via pageToken.
 */
export async function GET(req: NextRequest) {
    const auth = await getValidAccessTokenOrRefresh();
    if (!auth) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;

    // ── Parse & validate ──
    const mode: GmailMode = params.get("mode") === "advanced" ? "advanced" : "basic";
    const mailbox: GmailMailbox = VALID_MAILBOXES.has(params.get("mailbox") ?? "")
        ? (params.get("mailbox") as GmailMailbox)
        : "inbox";
    const status: GmailStatus = VALID_STATUSES.has(params.get("status") ?? "")
        ? (params.get("status") as GmailStatus)
        : "all";
    const category: GmailCategory = VALID_CATEGORIES.has(params.get("category") ?? "")
        ? (params.get("category") as GmailCategory)
        : "all";
    const rawQuery = (params.get("query") ?? "").trim();
    const pageToken = params.get("pageToken") || undefined;

    // ── Build query ──
    let query: string;
    let unreadQuery: string;

    if (mode === "advanced" && rawQuery.length > 0) {
        query = rawQuery;
        unreadQuery = rawQuery.includes("is:unread") ? rawQuery : `${rawQuery} is:unread`;
    } else {
        query = buildBasicQuery(mailbox, status, category);
        unreadQuery = buildBasicUnreadQuery(mailbox, category);
    }

    try {
        const client = getOAuthClient({ access_token: auth.accessToken });
        const gmail = google.gmail({ version: "v1", auth: client });

        // ── Unread count (context-aware, only on first page) ──
        let unreadCount = 0;
        if (!pageToken) {
            const { data: unreadList } = await gmail.users.messages.list({
                userId: "me",
                q: unreadQuery,
                maxResults: 1,
            });
            unreadCount = unreadList.resultSizeEstimate ?? 0;
        }

        // ── Fetch message list ──
        const { data: msgList } = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: PAGE_SIZE,
            pageToken,
        });

        const messageIds = (msgList.messages ?? []).map((m) => m.id!);

        // ── Fetch metadata in parallel ──
        const messages = await Promise.all(
            messageIds.map(async (msgId) => {
                const { data: msg } = await gmail.users.messages.get({
                    userId: "me",
                    id: msgId,
                    format: "metadata",
                    metadataHeaders: ["Subject", "From", "Date"],
                });

                const headers = msg.payload?.headers ?? [];
                const subject = headers.find((h) => h.name === "Subject")?.value ?? "(No Subject)";
                const from = headers.find((h) => h.name === "From")?.value ?? "(Unknown Sender)";
                const date = headers.find((h) => h.name === "Date")?.value ?? "";

                return {
                    id: msg.id ?? msgId,
                    threadId: msg.threadId ?? msgId,
                    subject,
                    from,
                    date,
                    snippet: msg.snippet ?? "",
                };
            })
        );

        const res = NextResponse.json({
            mode,
            query,
            unreadCount,
            messages,
            nextPageToken: msgList.nextPageToken ?? undefined,
        });
        return applyRefreshedCookies(res, auth.newTokens);
    } catch (error) {
        console.error("[Gmail] Summary error:", error);
        return NextResponse.json({ error: "Failed to fetch Gmail summary" }, { status: 500 });
    }
}
