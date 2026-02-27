"use client";

import type { ProjectStats } from "@/types/insights";

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

interface ProjectInsightsProps {
    projectStats: ProjectStats;
}

export default function ProjectInsights({ projectStats }: ProjectInsightsProps) {
    const { stats, active, completed, avgProgress } = projectStats;

    return (
        <div className="flex flex-col h-full w-full">
            {/* Scrollable Content Section — MANDATORY flex-1 scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-3 space-y-4 custom-scrollbar">
                {stats.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-xs opacity-30 text-center uppercase tracking-widest font-bold">No projects tracked</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 py-2">
                        {stats.map((p) => (
                            <div key={p.id} className="flex flex-col gap-2 group/proj">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 @md/insights:gap-3">
                                        <div
                                            className="w-2.5 h-2.5 @md/insights:w-3.5 @md/insights:h-3.5 @xl/insights:w-4.5 @xl/insights:h-4.5 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.1)] transition-all"
                                            style={{
                                                background: p.color,
                                                boxShadow: `0 0 10px ${p.color}40`
                                            }}
                                        />
                                        <span
                                            className="text-[12px] @md/insights:text-[14px] @xl/insights:text-[16px] font-bold truncate max-w-[160px] @md/insights:max-w-[200px] @xl/insights:max-w-[280px] tracking-tight group-hover/proj:text-white transition-all"
                                            style={{ color: "var(--color-text-secondary)" }}
                                        >
                                            {p.name}
                                        </span>
                                    </div>
                                    <span className="text-[11px] @md/insights:text-xs @xl/insights:text-sm font-black opacity-40 tabular-nums transition-all">
                                        {Math.round(p.progress)}%
                                    </span>
                                </div>
                                <div
                                    className="h-2 rounded-full bg-white/[0.04] overflow-hidden"
                                >
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${p.progress}%`,
                                            background: p.color,
                                            boxShadow: `0 0 12px ${p.color}20`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
