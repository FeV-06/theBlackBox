"use client";

import { BarChart3 } from "lucide-react";
import type { TimeRange } from "@/types/insights";

const RANGES: TimeRange[] = ["day", "week", "month"];

interface InsightsHeaderProps {
    range: TimeRange;
    setRange: (r: TimeRange) => void;
}

export default function InsightsHeader({ range, setRange }: InsightsHeaderProps) {
    return (
        <div className="flex items-center justify-between px-1 pb-2 shrink-0">
            <div className="flex items-center gap-2">
                <BarChart3 size={14} style={{ color: "var(--color-accent)" }} />
                <span
                    className="text-xs font-bold tracking-tight"
                    style={{ color: "var(--color-text-primary)" }}
                >
                    Insights
                </span>
            </div>

            <div className="flex bg-white/[0.04] p-0.5 rounded-lg">
                {RANGES.map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize transition-all ${range === r
                                ? "bg-white/10 text-white shadow-[0_0_8px_rgba(124,92,255,0.2)]"
                                : "text-white/40 hover:text-white/70"
                            }`}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>
    );
}
