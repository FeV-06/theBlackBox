import type { WidgetManifest, WidgetRegistry } from "./types";

/**
 * The central lookup table for all registered widget templates.
 * Populated by loadWidgets() at application startup.
 * The dashboard should never bypass this registry to import widgets directly.
 */
export const widgetRegistry: WidgetRegistry = new Map<string, WidgetManifest>();

/**
 * Register a single manifest. Validates uniqueness and required fields.
 * @throws {Error} on duplicate ID, missing required manifest fields, or missing configSchema.
 */
export function registerManifest(manifest: WidgetManifest): void {
    if (!manifest.id || typeof manifest.id !== "string") {
        throw new Error("[WidgetRegistry] Manifest is missing a valid `id` field.");
    }
    if (typeof manifest.component !== "function") {
        throw new Error(
            `[WidgetRegistry] Manifest "${manifest.id}" is missing a valid \`component\` factory function.`
        );
    }
    if (!manifest.configSchema) {
        throw new Error(
            `[WidgetRegistry] Manifest "${manifest.id}" is missing \`configSchema\`. ` +
            `Even if this widget has no configuration, it must declare \`configSchema: {}\`. ` +
            `This ensures compatibility with the Widget Builder.`
        );
    }
    if (widgetRegistry.has(manifest.id)) {
        if (process.env.NODE_ENV === "development") {
            widgetRegistry.set(manifest.id, manifest);
            return;
        }
        throw new Error(
            `Widget manifest collision detected.\n` +
            `Widget id "${manifest.id}" is already registered.\n` +
            `Each widget manifest must have a unique id.`
        );
    }
    widgetRegistry.set(manifest.id, manifest);
}

/** Look up a runtime manifest by type. Returns undefined for unknown types. */
export function getManifest(type: string): WidgetManifest | undefined {
    return widgetRegistry.get(type);
}

// ─── Builder Templates Registry ──────────────────────────────────────────

/**
 * The registry exclusively for Builder Templates.
 * Only widgets in this registry appear in the Widget Builder UI.
 */
export const widgetTemplateRegistry: WidgetRegistry = new Map<string, WidgetManifest>();

export function registerTemplateManifest(manifest: WidgetManifest): void {
    if (!manifest.id || typeof manifest.id !== "string") {
        throw new Error("[WidgetTemplateRegistry] Manifest is missing a valid `id`.");
    }
    if (typeof manifest.component !== "function") {
        throw new Error(`[WidgetTemplateRegistry] Manifest "${manifest.id}" missing \`component\` factory.`);
    }
    if (widgetTemplateRegistry.has(manifest.id)) {
        if (process.env.NODE_ENV === "development") {
            widgetTemplateRegistry.set(manifest.id, manifest);
            return;
        }
        throw new Error(`[WidgetTemplateRegistry] Manifest collision for "${manifest.id}".`);
    }
    widgetTemplateRegistry.set(manifest.id, manifest);
}

export function getTemplateManifest(type: string): WidgetManifest | undefined {
    return widgetTemplateRegistry.get(type);
}
