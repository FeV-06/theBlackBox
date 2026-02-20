"use client";

interface StatsRowProps {
    focusDisplay: string;
    tasksCompleted: number;
    completionPct: number;
}

export default function StatsRow({ focusDisplay, tasksCompleted, completionPct }: StatsRowProps) {
    return (
        <div className="grid grid-cols-3 gap-3 px-2 py-3 mt-auto shrink-0 border-t border-white/[0.04]">
            <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-black tracking-tighter text-white/40 uppercase">Focus</span>
                <span className="text-[11px] font-bold text-white/80">{focusDisplay}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-black tracking-tighter text-white/40 uppercase">Tasks</span>
                <span className="text-[11px] font-bold text-white/80">{tasksCompleted}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] font-black tracking-tighter text-white/40 uppercase">Projects</span>
                <span className="text-[11px] font-bold text-white/80">{Math.round(completionPct)}%</span>
            </div>
        </div>
    );
}
