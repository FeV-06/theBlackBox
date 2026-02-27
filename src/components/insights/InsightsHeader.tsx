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
        <div className="flex items-center justify-between px-1 pb-2 @md/insights:px-2 @md/insights:pb-3 @xl/insights:px-3 @xl/insights:pb-4 shrink-0 transition-all">
            <div className="flex items-center gap-2 @md/insights:gap-3">
                <BarChart3 className="w-3.5 h-3.5 @md/insights:w-4 @md/insights:h-4 @xl/insights:w-5 @xl/insights:h-5 transition-all" style={{ color: "var(--color-accent)" }} />
                <span
                    className="text-xs @md/insights:text-sm @xl/insights:text-base font-bold tracking-tight transition-all"
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
                        className={`px-2 py-0.5 @md/insights:px-3 @md/insights:py-1 @xl/insights:px-4 @xl/insights:py-1.5 rounded-md text-[10px] @md/insights:text-[11px] @xl/insights:text-xs font-semibold capitalize transition-all ${range === r
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
