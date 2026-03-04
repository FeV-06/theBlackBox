"use client";

import type { FocusSession } from "@/types/widget";

/**
 * FocusRow — shape of a row in the Supabase `focus_sessions` table.
 */
export interface FocusRow {
    id: string;
    user_id?: string;
    project_id: string | null;
    start_time: string;
    end_time: string;
    duration: number;
    mode: string;
    device_id: string;
    updated_at?: string;
    deleted_at: string | null;
}

/** Convert FocusSession -> FocusRow */
export function sessionToRow(session: FocusSession, userId: string, deviceId = "web"): FocusRow {
    return {
        id: session.id,
        user_id: userId,
        start_time: new Date(session.startTime).toISOString(),
        end_time: new Date(session.endTime).toISOString(),
        duration: session.duration,
        mode: session.type, // "normal" | "pomodoro"
        project_id: null,   // currently not linked in store, but schema supports it
        device_id: deviceId,
        deleted_at: null,
    };
}

/** Convert FocusRow -> FocusSession */
export function rowToSession(row: FocusRow): FocusSession {
    return {
        id: row.id,
        startTime: new Date(row.start_time).getTime(),
        endTime: new Date(row.end_time).getTime(),
        duration: row.duration,
        type: row.mode as "normal" | "pomodoro",
    };
}
