/** Only active in development builds — zero overhead in production */
const isDev = process.env.NODE_ENV === "development";

export interface WidgetDiagnostics {
    widgetId: string;
    type: string;
    renderCount: number;
    lastRenderMs: number;
    renderDurationMs: number | null;
    loadTimeMs: number | null;
    configSize: number;
    errorCount: number;
    lastError: string | null;
}

const store = new Map<string, WidgetDiagnostics>();

function getOrCreate(widgetId: string, type = "unknown"): WidgetDiagnostics {
    if (!store.has(widgetId)) {
        store.set(widgetId, {
            widgetId,
            type,
            renderCount: 0,
            lastRenderMs: 0,
            renderDurationMs: null,
            loadTimeMs: null,
            configSize: 0,
            errorCount: 0,
            lastError: null,
        });
    }
    return store.get(widgetId)!;
}

export const widgetDebug = {
    logRender(widgetId: string, type?: string): void {
        if (!isDev) return;
        const diag = getOrCreate(widgetId, type);
        diag.renderCount += 1;
        diag.lastRenderMs = performance.now();
    },

    logLoadTime(widgetId: string, durationMs: number, type?: string): void {
        if (!isDev) return;
        const diag = getOrCreate(widgetId, type);
        diag.loadTimeMs = durationMs;
        console.debug(`[WidgetEngine] ${widgetId} loaded in ${durationMs.toFixed(1)}ms`);
    },

    logRenderDuration(widgetId: string, durationMs: number): void {
        if (!isDev) return;
        const diag = getOrCreate(widgetId);
        diag.renderDurationMs = durationMs;
        if (durationMs > 100) {
            console.warn(`[WidgetEngine] Slow render detected: widget "${widgetId}" took ${durationMs.toFixed(1)}ms`);
        }
    },

    logError(widgetId: string, error: unknown, type?: string): void {
        if (!isDev) return;
        const diag = getOrCreate(widgetId, type);
        diag.errorCount += 1;
        diag.lastError = error instanceof Error ? error.message : String(error);
        console.error(`[WidgetEngine] Error in widget "${widgetId}":`, error);
    },

    logConfigSize(widgetId: string, config: Record<string, unknown>): void {
        if (!isDev) return;
        const diag = getOrCreate(widgetId);
        diag.configSize = JSON.stringify(config).length;
    },

    getDiagnostics(widgetId: string): WidgetDiagnostics | undefined {
        return store.get(widgetId);
    },

    getAllDiagnostics(): WidgetDiagnostics[] {
        return Array.from(store.values());
    },

    clear(widgetId?: string): void {
        if (widgetId) {
            store.delete(widgetId);
        } else {
            store.clear();
        }
    },
};
