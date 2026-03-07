import { Suspense, lazy, useMemo, useEffect, useRef, useState, useCallback } from "react";
import { getTemplateManifest } from "@/widgets/registry";
import { widgetDebug } from "@/widgets/debug/widgetDebug";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";
import { DefaultWidgetSkeleton } from "./DefaultWidgetSkeleton";
import { useWidgetStore } from "@/store/useWidgetStore";
import { WidgetHealthContext, HealthStatusType } from "./WidgetHealthContext";

export { useWidgetHealth } from "./WidgetHealthContext";
export type { HealthStatusType };

interface WidgetRuntimeProps {
    widgetId: string;
    widgetType: string;
    version?: number;
    config?: Record<string, unknown>;
    onRemove?: (widgetId: string) => void;
    onHealthReport?: (status: HealthStatusType, lastUpdated: number, message?: string) => void;
}

/**
 * WidgetRuntime is the top-level execution environment for a single widget instance.
 */
export function WidgetRuntime({
    widgetId,
    widgetType,
    version = 1,
    config = {},
    onRemove,
    onHealthReport,
}: WidgetRuntimeProps) {
    const loadStartRef = useRef<number>(performance.now());
    const renderStartRef = useRef<number>(performance.now());
    const [health, setHealth] = useState<HealthStatusType>('loading');
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

    // Reactive registry check
    const storeManifest = useWidgetStore((s) => s.registry.get(widgetType));
    // Static registry fallback (for template-based widgets)
    const manifest = storeManifest || getTemplateManifest(widgetType);

    // V1.6: Status Tracking Ref (Fixes infinite render loops)
    const statusRef = useRef<HealthStatusType | null>(null);
    const reportRef = useRef(onHealthReport);
    reportRef.current = onHealthReport;

    const reportHealth = useCallback((status: HealthStatusType, message?: string) => {
        if (statusRef.current === status && !message) return; // Only allow repeat if message is new
        statusRef.current = status;

        setHealth(status);
        const now = Date.now();
        setLastUpdated(now);
        reportRef.current?.(status, now, message);
    }, []); // No dependencies = stable identity

    // Memoized React.lazy
    const LazyComponent = useMemo(() => {
        if (!manifest) return null;
        return lazy(manifest.component as any);
    }, [widgetType, manifest]);

    // Config hydration
    const migratedConfig = useMemo(() => {
        if (!manifest?.migrations) return config;
        let cfg = { ...config };
        const currentVersion = version ?? 1;
        for (const [targetVer, migrate] of Object.entries(manifest.migrations)) {
            if (parseInt(targetVer, 10) > currentVersion) {
                cfg = migrate(cfg);
            }
        }
        return cfg;
    }, [config, version, manifest]);

    // Lifecycle logging
    useEffect(() => {
        const loadDuration = performance.now() - loadStartRef.current;
        widgetDebug.logLoadTime(widgetId, loadDuration, widgetType);
        widgetDebug.logConfigSize(widgetId, migratedConfig);

        reportHealth('loading');

        return () => {
            if (process.env.NODE_ENV === "development") {
                console.debug(`[WidgetEngine] Unmounted widget: ${widgetType} (${widgetId})`);
            }
        };
    }, [widgetId, widgetType]);

    // Render timing
    useEffect(() => {
        const duration = performance.now() - renderStartRef.current;
        widgetDebug.logRenderDuration(widgetId, duration);
    });

    renderStartRef.current = performance.now();
    widgetDebug.logRender(widgetId, widgetType);

    if (!manifest || !LazyComponent) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center gap-2 text-white/40">
                <span className="text-xl">⚠️</span>
                <div className="text-xs font-bold uppercase tracking-widest">Unknown Widget</div>
                <div className="text-[10px] opacity-60 italic">{widgetType}</div>
            </div>
        );
    }

    const fallback = manifest.skeleton ?? <DefaultWidgetSkeleton />;

    return (
        <WidgetHealthContext.Provider value={{ reportHealth }}>
            <WidgetErrorBoundary
                widgetId={widgetId}
                widgetType={widgetType}
                onRemove={onRemove}
            >
                <Suspense fallback={fallback}>
                    <LazyComponent widgetId={widgetId} />
                </Suspense>
            </WidgetErrorBoundary>

            {process.env.NODE_ENV === "development" && health !== "success" && (
                <WidgetDevOverlay
                    widgetId={widgetId}
                    configSize={JSON.stringify(migratedConfig).length}
                    health={health}
                />
            )}
        </WidgetHealthContext.Provider>
    );
}

// ─── Dev Overlay ─────────────────────────────────────────────────────────────

interface OverlayProps {
    widgetId: string;
    configSize: number;
    health: HealthStatusType;
}

function WidgetDevOverlay({ widgetId, configSize, health }: OverlayProps) {
    const diag = widgetDebug.getDiagnostics(widgetId);
    if (!diag) return null;

    const healthColor = {
        loading: "var(--color-warning)",
        success: "var(--color-success)",
        error: "var(--color-danger)",
        stale: "var(--color-text-muted)"
    }[health];

    return (
        <div
            data-widget-dev-overlay
            style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                background: "color-mix(in srgb, var(--color-bg), transparent 30%)",
                color: "var(--color-accent)",
                fontSize: "9px",
                fontFamily: "monospace",
                padding: "2px 5px",
                borderRadius: "3px",
                lineHeight: 1.6,
                pointerEvents: "none",
                zIndex: 9999,
            }}
        >
            <div>{diag.type} v{diag.loadTimeMs ? `${diag.loadTimeMs.toFixed(0)}ms` : "…"}</div>
            <div>renders: {diag.renderCount} | cfg: {configSize}B</div>
            <div style={{ color: healthColor }}>status: {health}</div>
            {diag.errorCount > 0 && (
                <div style={{ color: "var(--color-danger)" }}>errors: {diag.errorCount}</div>
            )}
        </div>
    );
}
