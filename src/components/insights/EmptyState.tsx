"use client";

import { BarChart3 } from "lucide-react";

export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-25">
            <BarChart3 size={28} />
            <p className="text-[10px] uppercase font-bold tracking-widest text-center">
                No insights yet
            </p>
            <p className="text-[10px] text-center opacity-60">
                Start a focus session or complete tasks
            </p>
        </div>
    );
}
