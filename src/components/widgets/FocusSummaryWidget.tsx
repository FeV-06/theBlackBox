"use client";

import { useFocusStore } from "@/store/useFocusStore";
import { getWeekDays, getDayLabel, formatTime } from "@/lib/utils";
import { Timer } from "lucide-react";
import type { WidgetInstance } from "@/types/widgetInstance";

export default function FocusSummaryWidget({ instance }: { instance: WidgetInstance }) {
    const sessions = useFocusStore((s) => s.sessions);
    const weekDays = getWeekDays();

    // Today's total
    const today = weekDays[6];
    const todaySeconds = sessions
        .filter((s) => new Date(s.startTime).toISOString().slice(0, 10) === today)
        .reduce((acc, s) => acc + s.duration, 0);

    // Weekly data
    const weekData = weekDays.map((day) => {
        const daySeconds = sessions
            .filter((s) => new Date(s.startTime).toISOString().slice(0, 10) === day)
            .reduce((acc, s) => acc + s.duration, 0);
        return { day, label: getDayLabel(day), hours: daySeconds / 3600 };
    });

    const maxHours = Math.max(...weekData.map((d) => d.hours), 1);

    return (
        <div className="flex flex-col gap-4 @md:gap-6 @xl:gap-8 h-full justify-center @container">
            {/* Today summary */}
            <div className="flex items-center gap-3 @md:gap-4 @xl:gap-5">
                <div
                    className="w-10 h-10 @md:w-14 @md:h-14 @xl:w-16 @xl:h-16 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: "rgba(124,92,255,0.12)" }}
                >
                    <Timer className="w-5 h-5 @md:w-7 @md:h-7 @xl:w-8 @xl:h-8 transition-all" style={{ color: "var(--color-accent)" }} />
                </div>
                <div>
                    <p className="text-xs @md:text-sm @xl:text-base transition-all" style={{ color: "var(--color-text-muted)" }}>Today</p>
                    <p className="text-lg @md:text-2xl @xl:text-3xl font-semibold transition-all" style={{ color: "var(--color-text-primary)" }}>
                        {formatTime(todaySeconds)}
                    </p>
                </div>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 @md:gap-2 @xl:gap-3 h-16 @md:h-28 @xl:h-40 transition-all">
                {weekData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div
                            className="w-full rounded-t-md transition-all duration-500"
                            style={{
                                height: `${Math.max((d.hours / maxHours) * 100, 4)}%`,
                                background:
                                    d.day === today
                                        ? "var(--color-accent)"
                                        : "rgba(124,92,255,0.25)",
                            }}
                        />
                        <span className="text-[10px] @md:text-xs @xl:text-sm transition-all" style={{ color: "var(--color-text-muted)" }}>
                            {d.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
