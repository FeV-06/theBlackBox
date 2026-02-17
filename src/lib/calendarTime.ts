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
 * Build an ISO datetime string with explicit timezone offset,
 * suitable for sending to the Google Calendar API.
 *
 * Takes a date (YYYY-MM-DD) and time (HH:mm) and a timezone,
 * and returns an ISO string like "2026-02-18T15:00:00+05:30".
 *
 * We use the browser's Intl to compute the correct UTC offset
 * for the given timezone at the given date/time.
 */
export function buildDateTimeISO(date: string, time: string, timeZone: string): string {
    // Create a Date object interpreted in the target timezone
    // by formatting then computing offset
    const naive = new Date(`${date}T${time}:00`);
    const utcMs = naive.getTime();

    // Get the offset for this timezone at this moment
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date(utcMs));
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";

    // Parse offset like "GMT+5:30" -> "+05:30"
    const offsetStr = parseGMTOffset(tzPart);
    return `${date}T${time}:00${offsetStr}`;
}

function parseGMTOffset(gmt: string): string {
    // Handles: "GMT", "GMT+5:30", "GMT-8", "GMT+12:45"
    const match = gmt.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
    if (!match) return "+00:00";
    const sign = match[1] || "+";
    const hours = match[2].padStart(2, "0");
    const mins = match[3] ?? "00";
    return `${sign}${hours}:${mins}`;
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
