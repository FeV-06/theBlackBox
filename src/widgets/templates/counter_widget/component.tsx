import React, { useEffect, useMemo } from "react";
import { useWidgetConfig } from "@/hooks/useWidgetConfig";
import { Plus, Minus } from "lucide-react";
import { iconMap } from "../shared/iconRegistry";
import { useWidgetHealth } from "@/components/widgets/engine/WidgetHealthContext";
import type { WidgetComponentProps } from "../../types";

export default function CounterWidgetComponent({ widgetId, previewConfig }: WidgetComponentProps) {
    const { config: storeConfig, updateConfig } = useWidgetConfig(widgetId);
    const config = previewConfig || storeConfig;
    const { reportHealth } = useWidgetHealth();

    useEffect(() => {
        reportHealth('success');
    }, [reportHealth]);

    const {
        label = "Tracker",
        step = 1,
        value = 0,
        goal = 0,
        min = 0,
        max = 9999,
        resetInterval = "never",
        lastResetAt,
        title = "Tracker",
        icon = "none",
        accentColor = "var(--color-accent)",
        background = "glass",
        textAlign = "center",
        fontSize = "medium"
    } = config as any;

    const numericValue = typeof value === 'number' ? value : parseInt(value as any, 10) || 0;

    useEffect(() => {
        if (previewConfig || !widgetId) return;

        const now = Date.now();
        const lastReset = lastResetAt || now;
        let shouldReset = false;

        if (resetInterval === "daily") {
            const lastDate = new Date(lastReset).toDateString();
            const currDate = new Date(now).toDateString();
            if (lastDate !== currDate) shouldReset = true;
        } else if (resetInterval === "weekly") {
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            if (now - lastReset > oneWeek) shouldReset = true;
        }

        if (shouldReset) {
            updateConfig({ value: 0, lastResetAt: now });
        }
    }, [widgetId, resetInterval, lastResetAt, updateConfig, previewConfig]);

    const handleIncrement = () => {
        if (previewConfig) return;
        const next = Math.min(max, numericValue + step);
        updateConfig({ value: next });
    };

    const handleDecrement = () => {
        if (previewConfig) return;
        const next = Math.max(min, numericValue - step);
        updateConfig({ value: next });
    };

    const statusColor = useMemo(() => {
        if (goal > 0 && numericValue >= goal) return "#22c55e"; // green if reached goal
        return accentColor;
    }, [numericValue, goal, accentColor]);

    const progress = goal > 0 ? Math.min(100, Math.max(0, (numericValue / goal) * 100)) : 0;

    const bgClass = {
        glass: "bg-white/[0.03] backdrop-blur-md border-white/10",
        solid: "bg-[var(--color-bg-card)] border-[var(--color-border)]",
        transparent: "bg-transparent border-transparent"
    }[background as "glass" | "solid" | "transparent"] || "bg-white/[0.03]";

    const Icon = icon !== "none" ? iconMap[icon] : null;

    return (
        <div className="flex flex-col h-full w-full p-4 overflow-hidden relative group">
            <div className="flex items-center gap-1.5 opacity-50 mb-2">
                {Icon && <Icon size={12} style={{ color: statusColor }} />}
                {title && (
                    <h3 className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--color-text-primary)" }}>
                        {title}
                    </h3>
                )}
            </div>

            <div className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl w-full border transition-all duration-300 ${bgClass}`}>
                <h3 className="text-xs font-medium text-center mb-3 opacity-60" style={{ color: "var(--color-text-primary)" }}>
                    {label}
                </h3>

                <div className="flex items-center justify-center gap-4 mb-4">
                    <button
                        title="Decrement"
                        onClick={handleDecrement}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all disabled:opacity-20"
                        disabled={!!previewConfig || value <= min}
                        style={{ color: "var(--color-text-primary)" }}
                    >
                        <Minus size={14} />
                    </button>

                    <div className="text-3xl font-black min-w-[2.5ch] text-center" style={{ color: "var(--color-text-primary)" }}>
                        {numericValue}
                    </div>

                    <button
                        title="Increment"
                        onClick={handleIncrement}
                        className="p-2 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-20"
                        disabled={!!previewConfig || value >= max}
                        style={{ backgroundColor: statusColor, color: "#fff" }}
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {goal > 0 && (
                    <div className="w-full flex flex-col gap-1.5 px-2">
                        <div className="flex justify-between text-[9px] font-bold opacity-40 uppercase tracking-tighter">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div
                                className="h-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: statusColor,
                                    boxShadow: `0 0 8px ${statusColor}40`
                                }}
                            />
                        </div>
                        <div className="text-[8px] text-center opacity-30 mt-0.5">
                            Goal: {goal}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

