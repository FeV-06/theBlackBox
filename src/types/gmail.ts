export type GmailMode = "basic" | "advanced";

export type GmailMailbox =
    | "inbox"
    | "sent"
    | "drafts"
    | "spam"
    | "trash"
    | "starred"
    | "important"
    | "all";

export type GmailStatus = "all" | "unread" | "read";

export type GmailCategory =
    | "all"
    | "primary"
    | "promotions"
    | "social"
    | "updates"
    | "forums";

export interface GmailSettings {
    mode: GmailMode;
    mailbox: GmailMailbox;
    status: GmailStatus;
    category: GmailCategory;
    query: string;
}

export interface GmailMessagePreview {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
}

export interface GmailSummaryResponse {
    mode: GmailMode;
    query: string;
    unreadCount: number;
    messages: GmailMessagePreview[];
    nextPageToken?: string;
}
