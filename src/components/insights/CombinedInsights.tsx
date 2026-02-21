"use client";

import {
    LineChart,
    Line,
    Tooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import type { CombinedPoint, InsightCard } from "@/types/insights";
import { formatDayLabel, formatDateFull } from "@/lib/insights/formatters";
import { useAccentColor } from "@/hooks/useAccentColor";

interface CombinedInsightsProps {
    data: CombinedPoint[];
    insights: InsightCard[];
    isCompact: boolean;
    focusDisplay: string;
    tasksCompleted: number;
    avgProgress: number;
}

const INSIGHT_ICON_COLORS: Record<InsightCard["type"], string> = {
    info: "var(--color-accent)",
    warning: "#FBBF24",
    success: "#4ADE80",
};

export default function CombinedInsights({
    data,
    insights,
    isCompact,
    focusDisplay,
    tasksCompleted,
    avgProgress,
}: CombinedInsightsProps) {
    const accent = useAccentColor();
    return (
        <div className="flex flex-col h-full w-full">
            {/* Chart Section — flex-1 */}
            <div className="flex-1 min-h-0 w-full mb-2">
                {data.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDayLabel}
                                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis yAxisId="left" hide />
                            <YAxis yAxisId="right" orientation="right" hide />
                            <Tooltip
                                content={({ payload, label }) => {
                                    if (!payload?.length) return null;
                                    return (
                                        <div className="bg-black/90 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] shadow-2xl backdrop-blur-md">
                                            <p className="text-white/60 mb-0.5">{formatDateFull(label as string ?? "")}</p>
                                            {payload.map((p, i) => (
                                                <p key={i} style={{ color: p.color as string }} className="font-bold">
                                                    {p.name}: {p.value}
                                                </p>
                                            ))}
                                        </div>
                                    );
                                }}
                            />
                            <Line
                                isAnimationActive={false}
                                yAxisId="left"
                                type="monotone"
                                dataKey="focusMinutes"
                                name="Focus"
                                stroke={accent}
                                strokeWidth={2.5}
                                dot={{ r: 2, fill: accent, strokeWidth: 0 }}
                                activeDot={{ r: 4, strokeWidth: 1, stroke: "#fff" }}
                            />
                            <Line
                                isAnimationActive={false}
                                yAxisId="right"
                                type="monotone"
                                dataKey="tasksCompleted"
                                name="Tasks"
                                stroke="#4ADE80"
                                strokeWidth={2.5}
                                dot={{ r: 2, fill: "#4ADE80", strokeWidth: 0 }}
                                activeDot={{ r: 4, strokeWidth: 1, stroke: "#fff" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center opacity-20 text-[10px] uppercase font-bold tracking-widest">
                        Data insufficient
                    </div>
                )}
            </div>

            {/* Insights Feed — flex-1 scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
                <div className="flex flex-col gap-2.5 pb-2">
                    {insights.length === 0 ? (
                        <div className="py-8 text-center opacity-20 text-[10px] uppercase font-bold tracking-tighter">
                            No insights available yet
                        </div>
                    ) : (
                        insights.map((card, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.05 }}
                                className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                            >
                                <div
                                    className="p-1.5 rounded-lg bg-white/[0.03] shrink-0"
                                    style={{ color: INSIGHT_ICON_COLORS[card.type] }}
                                >
                                    <Lightbulb size={13} />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span
                                        className="text-[11px] leading-relaxed font-medium"
                                        style={{ color: "var(--color-text-secondary)" }}
                                    >
                                        {card.text}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
