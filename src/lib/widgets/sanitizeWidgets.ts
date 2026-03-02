import { registryMap } from "@/lib/widgetRegistry";
import type { WidgetInstance } from "@/types/widgetInstance";

/**
 * Sanitizes a widget instances map + layout array before applying to the store.
 *
 * Problems corrected:
 *  - Layout IDs referencing non-existent instances (orphan layout entries)
 *  - Instances with widget types no longer in the registry (stale/removed types)
 *  - Duplicate instanceIds in the layout (only first occurrence kept)
 *
 * Returns a new, clean { instances, layout } pair safe for use in Swiper / the widget store.
 */
export function sanitizeWidgets(
    rawInstances: Record<string, WidgetInstance>,
    rawLayout: string[]
): { instances: Record<string, WidgetInstance>; layout: string[] } {
    const seenIds = new Set<string>();
    const cleanLayout: string[] = [];
    const cleanInstances: Record<string, WidgetInstance> = {};

    for (const id of rawLayout) {
        // 1. Skip duplicate layout entries
        if (seenIds.has(id)) {
            if (process.env.NODE_ENV === "development") {
                console.warn(`[sanitizeWidgets] Duplicate layout entry removed: "${id}"`);
            }
            continue;
        }

        // 2. Skip layout IDs with no matching instance
        const inst = rawInstances[id];
        if (!inst) {
            if (process.env.NODE_ENV === "development") {
                console.warn(`[sanitizeWidgets] Orphan layout ID removed (no instance): "${id}"`);
            }
            continue;
        }

        // 3. Skip instances whose type is not in the current registry
        if (!registryMap.get(inst.type)) {
            if (process.env.NODE_ENV === "development") {
                console.warn(`[sanitizeWidgets] Unknown widget type removed: "${inst.type}" (id: "${id}")`);
            }
            continue;
        }

        seenIds.add(id);
        cleanLayout.push(id);
        cleanInstances[id] = inst;
    }

    if (process.env.NODE_ENV === "development") {
        const removedCount = rawLayout.length - cleanLayout.length;
        if (removedCount > 0) {
            console.log(
                `[sanitizeWidgets] Sanitized: ${rawLayout.length} → ${cleanLayout.length} widgets (${removedCount} removed)`
            );
        }
    }

    return { instances: cleanInstances, layout: cleanLayout };
}
