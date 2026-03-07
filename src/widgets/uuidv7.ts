/**
 * UUID v7 Generator
 *
 * UUID v7 encodes a Unix timestamp in the most-significant bits,
 * making IDs time-ordered and more efficient for database indexing
 * (especially Supabase/PostgreSQL B-tree indexes vs. random UUID v4).
 *
 * Format: {48-bit unix_ms}{4-bit ver=7}{12-bit rand_a}{2-bit var}{62-bit rand_b}
 */
export function generateWidgetId(): string {
    const now = Date.now();

    // Encode timestamp in the first 12 hex chars (48 bits)
    const tHex = now.toString(16).padStart(12, "0");

    // Generate random bytes for the remaining sections
    const rand = () => Math.floor(Math.random() * 0x10).toString(16);
    const rand4 = () => Array.from({ length: 4 }, rand).join("");
    const rand12 = () => Array.from({ length: 12 }, rand).join("");

    // Build UUID v7: version nibble is '7', variant nibble is '8'-'b'
    const version = "7";
    const variantNibble = (8 + Math.floor(Math.random() * 4)).toString(16); // 8, 9, a, or b

    return [
        tHex.slice(0, 8),
        tHex.slice(8, 12),
        version + rand4().slice(0, 3),
        variantNibble + rand4().slice(0, 3),
        rand12(),
    ].join("-");
}
