/**
 * Google Calendar Event Colors (Hardcoded fallback map).
 * These match the standard Google Calendar palette.
 * Keys 1-11 are standard.
 */

export interface GoogleColorEntry {
    background: string;
    foreground: string;
}

export const GOOGLE_COLOR_MAP: Record<string, GoogleColorEntry> = {
    "1": { background: "#7986CB", foreground: "#FFFFFF" }, // Lavender
    "2": { background: "#33B679", foreground: "#FFFFFF" }, // Sage
    "3": { background: "#8E24AA", foreground: "#FFFFFF" }, // Grape
    "4": { background: "#E67C73", foreground: "#FFFFFF" }, // Flamingo
    "5": { background: "#F6BF26", foreground: "#FFFFFF" }, // Banana
    "6": { background: "#F4511E", foreground: "#FFFFFF" }, // Tangerine
    "7": { background: "#039BE5", foreground: "#FFFFFF" }, // Peacock
    "8": { background: "#616161", foreground: "#FFFFFF" }, // Graphite
    "9": { background: "#3F51B5", foreground: "#FFFFFF" }, // Blueberry
    "10": { background: "#0B8043", foreground: "#FFFFFF" }, // Basil
    "11": { background: "#D50000", foreground: "#FFFFFF" }, // Tomato
};

export const DEFAULT_EVENT_COLOR: GoogleColorEntry = {
    background: "#039BE5", // Default to Peacock blue-ish
    foreground: "#FFFFFF",
};

export function getEventColor(colorId?: string): GoogleColorEntry {
    if (!colorId) return DEFAULT_EVENT_COLOR;
    return GOOGLE_COLOR_MAP[colorId] || DEFAULT_EVENT_COLOR;
}
