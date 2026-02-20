import type { TodoItem } from "@/types/widgetInstance";
import { combineLocalDateTime, getBrowserTimeZone } from "./calendarTime";

export interface SyncResult {
    success: boolean;
    eventId?: string;
    error?: string;
}

/**
 * Builds the payload for sending to the Google Calendar API.
 */
export function buildEventPayload(task: TodoItem) {
    if (!task.dueDate) throw new Error("Task missing dueDate for sync");

    const timeZone = getBrowserTimeZone();
    // We create a "start of day" local datetime string without Z, 
    // so Google parses it exactly in the user's timezone.
    const startDateTime = combineLocalDateTime(task.dueDate, "00:00");
    // We'll make it a 1-hour event by default or you can make it all-day.
    // Making it a 1-hour event at midnight for simplicity.
    const endDateTime = combineLocalDateTime(task.dueDate, "01:00");

    return {
        summary: task.text,
        description: "From TheBlackBox",
        start: startDateTime,
        end: endDateTime,
        timeZone,
    };
}

/**
 * Creates a new event in Google Calendar based on the given task.
 */
export async function createCalendarEventFromTask(task: TodoItem): Promise<SyncResult> {
    try {
        const payload = buildEventPayload(task);

        const res = await fetch("/api/google/calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.error || "Failed to create event" };
        }

        return { success: true, eventId: data.event.id };
    } catch (error: any) {
        console.error("[Sync] createCalendarEventFromTask error:", error);
        return { success: false, error: error.message || "Network error" };
    }
}

/**
 * Updates an existing event in Google Calendar based on the given task.
 */
export async function updateCalendarEventFromTask(task: TodoItem): Promise<SyncResult> {
    if (!task.linkedEventId) {
        return { success: false, error: "Missing linkedEventId" };
    }

    try {
        const payload = buildEventPayload(task);

        const res = await fetch(`/api/google/calendar/events/${task.linkedEventId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.error || "Failed to update event" };
        }

        return { success: true, eventId: data.event.id };
    } catch (error: any) {
        console.error("[Sync] updateCalendarEventFromTask error:", error);
        return { success: false, error: error.message || "Network error" };
    }
}

/**
 * Deletes an existing event in Google Calendar.
 */
export async function deleteCalendarEvent(eventId: string): Promise<SyncResult> {
    try {
        const res = await fetch(`/api/google/calendar/events/${eventId}`, {
            method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
            return { success: false, error: data.error || "Failed to delete event" };
        }

        return { success: true };
    } catch (error: any) {
        console.error("[Sync] deleteCalendarEvent error:", error);
        return { success: false, error: error.message || "Network error" };
    }
}
