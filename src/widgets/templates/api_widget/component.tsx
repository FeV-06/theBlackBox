import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { iconMap } from "../shared/iconRegistry";
import { fetchData, safeParseJSON, getNestedField } from "../../utils/fetchData";
import { useWidgetHealth } from "@/components/widgets/engine/WidgetHealthContext";
import type { WidgetComponentProps } from "../../types";

function applyTransform(value: any, transform: string) {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    switch (transform) {
        case "percentage": return num * 100;
        case "round": return Math.round(num);
        case "multiply": return num; // Placeholder for future generic multiply
        case "divide": return num; // Placeholder for future generic divide
        default: return num;
    }
}

export default function ApiWidgetComponent({ widgetId, previewConfig }: WidgetComponentProps) {
    const { config: storeConfig } = useWidgetConfig(widgetId);
    const config = previewConfig || storeConfig;
    const { reportHealth } = useWidgetHealth();
    const reportRef = useRef(reportHealth);
    reportRef.current = reportHealth;

    const [data, setData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const {
        url, field, method = "GET", headers, body,
        refresh = 60, refreshMode = "interval",
        transform = "none",
        display = "text",
        prefix = "", suffix = "", decimals = 0,
        thresholdLow, thresholdHigh,
        title = "Data Widget",
        icon = "none",
        accentColor, background = "glass", textAlign = "center", fontSize = "medium"
    } = config as any;

    const executeFetch = useCallback(async (signal: AbortSignal) => {
        if (!url) {
            setData("No URL configured.");
            setLoading(false);
            reportRef.current('stale', 'Configuration Missing: URL is not set.');
            return;
        }

        setLoading(true);
        setError(null);
        reportRef.current('loading');

        try {
            const json = await fetchData({ url, method, headers, body, signal });
            let rawValue = field ? getNestedField(json, field) : json;

            // Apply transformations
            let finalValue = applyTransform(rawValue, transform);

            if (signal.aborted) return;
            setData(finalValue !== undefined ? String(finalValue) : "No data found");
            reportRef.current('success', `Data resolved: ${field || 'Root'}`);
        } catch (err: any) {
            if (signal.aborted) return;
            const errorMsg = err.message || "Failed to fetch data.";
            setError(errorMsg);
            reportRef.current('error', errorMsg);
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, [url, method, headers, body, field, transform]);

    useEffect(() => {
        if (previewConfig) {
            setData("42.758");
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        executeFetch(controller.signal);

        let intervalId: any;
        if (refreshMode === "interval" && refresh > 0) {
            intervalId = setInterval(() => {
                const innerController = new AbortController();
                executeFetch(innerController.signal);
            }, refresh * 1000);
        }

        return () => {
            controller.abort();
            if (intervalId) clearInterval(intervalId);
        };
    }, [executeFetch, refresh, refreshMode, previewConfig, refreshTrigger]);

    const formattedValue = useMemo(() => {
        if (data === null || error) return data;
        const num = parseFloat(data);
        if (isNaN(num)) return `${prefix}${data}${suffix}`;

        const fixed = num.toFixed(decimals);
        return `${prefix}${fixed}${suffix}`;
    }, [data, prefix, suffix, decimals, error]);

    const statusColor = useMemo(() => {
        if (data === null || error) return "var(--color-text-primary)";
        const num = parseFloat(data);
        if (isNaN(num)) return accentColor || "var(--color-text-primary)";

        const low = thresholdLow !== undefined && thresholdLow !== "" ? parseFloat(thresholdLow as string) : undefined;
        const high = thresholdHigh !== undefined && thresholdHigh !== "" ? parseFloat(thresholdHigh as string) : undefined;

        if (low !== undefined && !isNaN(low) && num < low) return "var(--color-danger)";
        if (high !== undefined && !isNaN(high) && num >= high) return "var(--color-success)";
        if ((low !== undefined && !isNaN(low)) || (high !== undefined && !isNaN(high))) return "var(--color-warning)";

        return accentColor || "var(--color-text-primary)";
    }, [data, error, thresholdLow, thresholdHigh, accentColor]);

    const bgClass = {
        glass: "bg-[var(--color-bg-card)]/40 backdrop-blur-md border-[var(--color-border)]",
        solid: "bg-[var(--color-bg-card)] border-[var(--color-border)]",
        transparent: "bg-transparent border-transparent"
    }[background as "glass" | "solid" | "transparent"] || "bg-[var(--color-bg-card)]/40 backdrop-blur-md border-[var(--color-border)]";

    const fontClass = {
        small: "text-xs",
        medium: "text-sm",
        large: "text-lg"
    }[fontSize as "small" | "medium" | "large"] || "text-sm";

    const alignClass = {
        left: "text-left",
        center: "text-center",
        right: "text-right"
    }[textAlign as "left" | "center" | "right"] || "text-center";

    const Icon = icon !== "none" ? iconMap[icon] : null;

    return (
        <div className="flex flex-col h-full w-full p-4 overflow-hidden relative group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 opacity-50 min-w-0">
                    {Icon && <Icon size={12} style={{ color: statusColor }} />}
                    {title && (
                        <h3 className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--color-text-primary)" }}>
                            {title}
                        </h3>
                    )}
                </div>

                {refreshMode === "manual" && !previewConfig && (
                    <button
                        onClick={() => setRefreshTrigger(t => t + 1)}
                        className="p-1 rounded-md hover:bg-white/5 transition-colors disabled:opacity-20"
                        title="Manual Refresh"
                        disabled={loading}
                    >
                        <RefreshCw size={12} className={`${loading ? 'animate-spin' : ''}`} style={{ color: statusColor }} />
                    </button>
                )}
            </div>

            <div className={`flex-1 flex flex-col justify-center items-center overflow-auto rounded-xl p-3 border transition-all duration-300 ${bgClass} ${fontClass} ${alignClass}`}>
                {loading && data === null ? (
                    <Loader2 className="w-5 h-5 animate-spin opacity-20" style={{ color: statusColor }} />
                ) : error ? (
                    <div className="flex flex-col items-center gap-2 p-2">
                        <AlertCircle className="w-5 h-5 text-red-500/50" />
                        <span className="text-[10px] opacity-60 leading-tight" style={{ color: "var(--color-text-primary)" }}>
                            {error}
                        </span>
                        <button
                            onClick={() => setRefreshTrigger(t => t + 1)}
                            className="mt-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-bold uppercase tracking-wider transition-all"
                            style={{ color: statusColor }}
                        >
                            Retry Fetch
                        </button>
                    </div>
                ) : (
                    <div className="w-full">
                        {display === "text" && (
                            <span className="font-bold transition-colors" style={{ color: statusColor }}>
                                {formattedValue}
                            </span>
                        )}
                        {display === "badge" && (
                            <span
                                className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/5 transition-all"
                                style={{ color: statusColor, borderColor: `${statusColor}40` }}
                            >
                                {formattedValue}
                            </span>
                        )}
                        {display === "progress" && (
                            <div className="w-full flex flex-col gap-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="font-bold text-xs" style={{ color: statusColor }}>{formattedValue}</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, parseFloat(data || "0")))}%`,
                                            backgroundColor: statusColor,
                                            boxShadow: `0 0 10px ${statusColor}40`
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        {!["text", "badge", "progress"].includes(display) && (
                            <pre className="whitespace-pre-wrap font-mono m-0 opacity-80" style={{ color: statusColor }}>
                                {data}
                            </pre>
                        )}
                    </div>
                )}
            </div>

            {loading && data !== null && (
                <div className="absolute bottom-2 right-2 p-1 bg-black/20 rounded shadow-2xl backdrop-blur-md">
                    <Loader2 size={10} className="animate-spin opacity-40 text-white" />
                </div>
            )}
        </div>
    );
}

