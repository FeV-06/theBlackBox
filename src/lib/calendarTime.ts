/**
 * Timezone-safe helpers for Google Calendar events.
 *
 * Google Calendar returns events with:
 *   - `start.dateTime` / `end.dateTime` (ISO 8601 with offset, e.g. "2026-02-18T15:00:00+05:30")
 *   - `start.date` / `end.date` for all-day events (e.g. "2026-02-18")
 *   - `start.timeZone` / `end.timeZone` (e.g. "Asia/Kolkata")
 *
 * The helpers here use `date-fns-tz` to display times in the event's own timezone,
 * avoiding double-conversion bugs from naive `new Date()` or `toLocaleString()`.
 */

import { formatInTimeZone } from "date-fns-tz";

export interface CalendarEvent {
    id: string;
    summary: string;
    description: string;
    start: string;        // ISO dateTime or date-only
    end: string;          // ISO dateTime or date-only
    startTimeZone: string; // IANA timezone
    endTimeZone: string;   // IANA timezone
    colorId?: string;      // Google Calendar colorId
    location?: string;
}

/** Detect all-day event (date-only string is exactly 10 chars: "YYYY-MM-DD") */
export function isAllDayEvent(event: CalendarEvent): boolean {
    return event.start.length <= 10;
}

/**
 * Get the local date string (YYYY-MM-DD) for the event start,
 * using the event's own timezone to avoid date-shift at midnight.
 */
export function getEventDateLocal(event: CalendarEvent): string {
    if (isAllDayEvent(event)) return event.start;
    return formatInTimeZone(event.start, event.startTimeZone, "yyyy-MM-dd");
}

/**
 * Format a time range string for display: "HH:mm – HH:mm" or "All Day".
 */
export function formatEventTimeRange(event: CalendarEvent): string {
    if (isAllDayEvent(event)) return "All Day";

    const startStr = formatInTimeZone(event.start, event.startTimeZone, "HH:mm");
    const endStr = formatInTimeZone(event.end, event.endTimeZone, "HH:mm");
    return `${startStr} – ${endStr}`;
}

/**
 * Extract HH:mm from an event start/end for pre-populating the edit form.
 */
export function extractTimeHHMM(isoString: string, timeZone: string): string {
    if (isoString.length <= 10) return "09:00";
    return formatInTimeZone(isoString, timeZone, "HH:mm");
}

/**
 * Build a local ISO datetime string (YYYY-MM-DDTHH:mm:ss)
 * explicitely WITHOUT timezone offset.
 *
 * This is crucial for Google Calendar API to interpret the time
 * in the accompanying `timeZone` field, rather than converting from UTC.
 */
export function combineLocalDateTime(date: string, time: string): string {
    // Ensure inputs are clean
    if (!time) time = "00:00";
    if (time.length === 5) time += ":00"; // HH:mm -> HH:mm:00
    return `${date}T${time}`;
}

/**
 * Extract HH:mm from an ISO string, ensuring we get the LOCAL time
 * relative to the event's timezone, not the browser's timezone.
 *
 * Handles:
 * - "2026-02-19T09:00:00" (Local)
 * - "2026-02-19T09:00:00+05:30" (Offset)
 * - "2026-02-19T03:30:00Z" (UTC)
 */
export function extractLocalTime(isoString: string, timeZone: string): string {
    if (isoString.length <= 10) return "09:00"; // Fallback for date-only

    try {
        return formatInTimeZone(isoString, timeZone, "HH:mm");
    } catch (e) {
        console.error("Failed to extract local time:", e);
        return "09:00";
    }
}

/**
 * Get browser's IANA timezone.
 */
export function getBrowserTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return "Asia/Kolkata";
    }
}

