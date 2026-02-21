"use client";

import {
    Tooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Area,
    AreaChart,
} from "recharts";
import type { FocusPoint } from "@/types/insights";
import { formatDayLabel, formatDuration, formatDateFull } from "@/lib/insights/formatters";
import { useAccentColor, hexToRgba } from "@/hooks/useAccentColor";

interface StatBoxProps {
    label: string;
    value: string;
}

function StatBox({ label, value }: StatBoxProps) {
    return (
        <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span className="text-xs font-bold" style={{ color: "var(--color-text-primary)" }}>
                {value}
            </span>
            <span className="text-[9px] uppercase tracking-wider opacity-30 mt-0.5">{label}</span>
        </div>
    );
}

interface FocusInsightsProps {
    data: FocusPoint[];
    totalMinutes: number;
    avgPerDay: number;
    bestDay: string;
    isCompact: boolean;
}

export default function FocusInsights({
    data,
    totalMinutes,
    avgPerDay,
    bestDay,
    isCompact,
}: FocusInsightsProps) {
    const accent = useAccentColor();
    const maxMin = Math.max(...data.map((d) => d.minutes), 1);

    return (
        <div className="flex flex-col h-full w-full">
            {/* Heatmap Section */}
            {!isCompact && (
                <div className="flex-none py-2">
                    <div className="flex flex-wrap gap-[3px]">
                        {data.map((d) => {
                            const intensity = d.minutes / maxMin;
                            return (
                                <div
                                    key={d.date}
                                    title={`${formatDuration(d.minutes)} on ${d.date}`}
                                    className="w-[12px] h-[12px] rounded-[2px] transition-all hover:scale-125 cursor-default"
                                    style={{
                                        background:
                                            intensity === 0
                                                ? "rgba(255,255,255,0.04)"
                                                : hexToRgba(accent, 0.15 + intensity * 0.85),
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Focus Chart Section — MANDATORY flex-1 stretch */}
            <div className="flex-1 min-h-0 w-full">
                {data.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="focusAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={hexToRgba(accent, 0.3)} />
                                    <stop offset="100%" stopColor={hexToRgba(accent, 0)} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDayLabel}
                                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis hide domain={[0, "auto"]} />
                            <Tooltip
                                content={({ payload, label }) => {
                                    if (!payload?.length) return null;
                                    return (
                                        <div className="bg-black/80 border border-white/10 rounded-lg px-2 py-1 text-[10px] shadow-xl">
                                            <p className="text-white/60">{formatDateFull(label as string ?? "")}</p>
                                            <p className="text-white font-semibold">{formatDuration(payload[0].value as number)}</p>
                                        </div>
                                    );
                                }}
                            />
                            <Area
                                isAnimationActive={false}
                                type="monotone"
                                dataKey="minutes"
                                stroke={accent}
                                strokeWidth={2}
                                fill="url(#focusAreaGrad)"
                                dot={{ fill: accent, r: 2, strokeWidth: 0 }}
                                activeDot={{ r: 4, fill: accent, stroke: "#fff", strokeWidth: 1 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center opacity-20 text-xs italic">
                        Insufficient data for chart
                    </div>
                )}
            </div>
        </div>
    );
}
