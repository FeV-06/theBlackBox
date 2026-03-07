import { WIDGET_REGISTRY } from "@/lib/widgetRegistry";
import { useWidgetStore } from "@/store/useWidgetStore";
import { registerManifest } from "./registry";
import type { WidgetManifest } from "./types";

let loaded = false;

/**
 * Discovers and registers all runtime widget manifests.
 *
 * Call this once at application startup — it is idempotent.
 */
export function runtimeLoader(): void {
    if (loaded) return;

    const errors: string[] = [];

    // Convert legacy widget definitions into new WidgetManifest objects
    WIDGET_REGISTRY.forEach((widgetDef) => {
        try {
            const manifest: WidgetManifest = {
                id: widgetDef.type,
                name: widgetDef.defaultTitle,
                description: `Add a ${widgetDef.defaultTitle} to your dashboard.`,
                component: async () => ({ default: widgetDef.component as any }),
                configSchema: widgetDef.configSchema || {},
                defaultConfig: widgetDef.defaultConfig || {},
                allowMultiple: widgetDef.allowMultiple ?? true,
            };

            // Register in both places so runtime can resolve it
            try { registerManifest(manifest); } catch { /* ignore collision on reload */ }
            useWidgetStore.getState().addManifestToRegistry(manifest);

            if (process.env.NODE_ENV === "development") {
                console.debug(`[RuntimeLoader] Registered legacy widget: ${manifest.id}`);
            }
        } catch (err) {
            errors.push(`[RuntimeLoader] Failed to register legacy widget "${widgetDef.type}": ${String(err)}`);
        }
    });

    if (errors.length > 0) {
        console.error(
            `Widget engine boot encountered ${errors.length} error(s):\n` +
            errors.join("\n")
        );
    }

    loaded = true;
}

/** Reset the loaded flag — only for testing or hot-reload purposes */
export function _resetRuntimeLoader(): void {
    loaded = false;
}
