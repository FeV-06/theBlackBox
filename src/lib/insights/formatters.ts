/**
 * Display formatting helpers for insights data.
 */

/** Format minutes to "Xh Ym" */
export function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

/** Format a date string to short label e.g. "Mon" */
export function formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** Format a date string to "Feb 18" */
export function formatDateShort(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format a date string to "Mon, Feb 18" */
export function formatDateFull(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
