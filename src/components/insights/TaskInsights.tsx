"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import type { TaskStats } from "@/types/insights";

interface StatBoxProps {
    label: string;
    value: string;
    accent?: boolean;
}

function StatBox({ label, value, accent }: StatBoxProps) {
    return (
        <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <span
                className="text-xs font-bold"
                style={{ color: accent ? "#F87171" : "var(--color-text-primary)" }}
            >
                {value}
            </span>
            <span className="text-[9px] uppercase tracking-wider opacity-30 mt-0.5">{label}</span>
        </div>
    );
}

interface TaskInsightsProps {
    stats: TaskStats;
    isCompact: boolean;
}

const DONUT_COLORS = ["#7C5CFF", "rgba(255,255,255,0.08)"];
const PRIORITY_BARS = [
    { key: "high" as const, label: "High", color: "#F87171" },
    { key: "medium" as const, label: "Medium", color: "#FBBF24" },
    { key: "low" as const, label: "Low", color: "#4ADE80" },
];

export default function TaskInsights({ stats, isCompact }: TaskInsightsProps) {
    const donutData = [
        { name: "Completed", value: stats.completed },
        { name: "Pending", value: stats.pending },
    ];

    const maxPriority = Math.max(
        stats.byPriority.high,
        stats.byPriority.medium,
        stats.byPriority.low,
        1
    );

    return (
        <div className="flex flex-col h-full w-full">
            {/* Donut Section — MANDATORY flex-[2] centered */}
            <div className="flex-[2] flex items-center justify-center min-h-0 relative">
                <div className="w-[65%] max-w-[220px] aspect-square relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="90%"
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                                isAnimationActive={true}
                            >
                                {donutData.map((_, i) => (
                                    <Cell key={i} fill={DONUT_COLORS[i]} />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ payload }) => {
                                    if (!payload?.length) return null;
                                    return (
                                        <div className="bg-black/80 border border-white/10 rounded-lg px-2 py-1 text-[10px]">
                                            <p className="text-white font-semibold">
                                                {payload[0].name}: {payload[0].value}
                                            </p>
                                        </div>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered % label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold tracking-tighter" style={{ color: "var(--color-text-primary)" }}>
                            {Math.round(stats.completionRate * 100)}%
                        </span>
                        <span className="text-[10px] uppercase opacity-30 font-bold tracking-wider">done</span>
                    </div>
                </div>
            </div>

            {/* Priority Bars Section — MANDATORY flex-[1] */}
            {!isCompact && (
                <div className="flex-[1] flex flex-col justify-center gap-3 px-4 min-h-0">
                    {PRIORITY_BARS.map((b) => (
                        <div key={b.key} className="flex items-center gap-3">
                            <span className="text-[10px] w-14 text-right font-bold text-white/30 uppercase tracking-tighter">{b.label}</span>
                            <div
                                className="flex-1 h-3 rounded-full overflow-hidden"
                                style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stats.byPriority[b.key] / maxPriority) * 100}%` }}
                                    className="h-full rounded-full"
                                    style={{
                                        background: b.color,
                                        boxShadow: `0 0 10px ${b.color}30`
                                    }}
                                />
                            </div>
                            <span className="text-[10px] w-8 font-bold text-white/50">{stats.byPriority[b.key]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
