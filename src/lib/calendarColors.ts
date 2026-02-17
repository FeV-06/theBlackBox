/**
 * Google Calendar color helpers.
 *
 * Google Calendar events can have a `colorId` (string like "1"–"11").
 * The actual hex values come from `calendar.colors.get()`.
 *
 * This module maps colorId → CSS styles for rendering.
 */

export interface GoogleColorEntry {
    background: string;
    foreground: string;
}

export type GoogleColorMap = Record<string, GoogleColorEntry>;

export interface ColorPalette {
    event: GoogleColorMap;
    calendar: GoogleColorMap;
}

const DEFAULT_STYLE = {
    backgroundColor: "rgba(124,92,255,0.15)",
    color: "#EDEBFF",
    borderColor: "rgba(124,92,255,0.3)",
};

/**
 * Get CSS styles for an event based on its colorId and the fetched color map.
 */
export function getEventColorStyle(
    colorId: string | undefined | null,
    eventColorMap: GoogleColorMap | null
): { backgroundColor: string; color: string; borderColor: string } {
    if (!colorId || !eventColorMap || !eventColorMap[colorId]) {
        return DEFAULT_STYLE;
    }

    const entry = eventColorMap[colorId];
    return {
        backgroundColor: hexToRgba(entry.background, 0.2),
        color: entry.background, // Use background as the text accent color for dark theme readability
        borderColor: hexToRgba(entry.background, 0.35),
    };
}

/**
 * Get the accent bar color (the solid left border strip) for an event.
 */
export function getEventBarColor(
    colorId: string | undefined | null,
    eventColorMap: GoogleColorMap | null
): string {
    if (!colorId || !eventColorMap || !eventColorMap[colorId]) {
        return "#7C5CFF";
    }
    return eventColorMap[colorId].background;
}

/**
 * Get the dot color for the month grid (small indicator).
 */
export function getEventDotColor(
    colorId: string | undefined | null,
    eventColorMap: GoogleColorMap | null
): string {
    return getEventBarColor(colorId, eventColorMap);
}

/**
 * Convert a hex color to rgba.
 */
function hexToRgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Get a sorted array of color entries for the color picker UI.
 * Returns [{id, background, foreground}].
 */
export function getColorPickerOptions(
    eventColorMap: GoogleColorMap | null
): { id: string; background: string; foreground: string }[] {
    if (!eventColorMap) return [];
    return Object.entries(eventColorMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([id, entry]) => ({
            id,
            background: entry.background,
            foreground: entry.foreground,
        }));
}
