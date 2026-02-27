"use client";

interface StatsRowProps {
    focusDisplay: string;
    tasksCompleted: number;
    completionPct: number;
}

export default function StatsRow({ focusDisplay, tasksCompleted, completionPct }: StatsRowProps) {
    return (
        <div className="grid grid-cols-3 gap-3 @md/insights:gap-4 px-2 py-3 @md/insights:px-4 @md/insights:py-4 @xl/insights:px-6 @xl/insights:py-5 mt-auto shrink-0 border-t border-white/[0.04] transition-all">
            <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] @md/insights:text-[11px] @xl/insights:text-xs font-black tracking-tighter text-white/40 uppercase transition-all">Focus</span>
                <span className="text-[11px] @md/insights:text-xs @xl/insights:text-sm font-bold text-white/80 transition-all">{focusDisplay}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] @md/insights:text-[11px] @xl/insights:text-xs font-black tracking-tighter text-white/40 uppercase transition-all">Tasks</span>
                <span className="text-[11px] @md/insights:text-xs @xl/insights:text-sm font-bold text-white/80 transition-all">{tasksCompleted}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] @md/insights:text-[11px] @xl/insights:text-xs font-black tracking-tighter text-white/40 uppercase transition-all">Projects</span>
                <span className="text-[11px] @md/insights:text-xs @xl/insights:text-sm font-bold text-white/80 transition-all">{Math.round(completionPct)}%</span>
            </div>
        </div>
    );
}
