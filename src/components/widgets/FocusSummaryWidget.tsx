"use client";

import { useFocusStore } from "@/store/useFocusStore";
import { getWeekDays, getDayLabel, formatTime } from "@/lib/utils";
import { Timer } from "lucide-react";

export default function FocusSummaryWidget() {
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
        <div className="flex flex-col gap-4">
            {/* Today summary */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(124,92,255,0.12)" }}
                >
                    <Timer size={20} style={{ color: "var(--color-accent)" }} />
                </div>
                <div>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Today</p>
                    <p className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        {formatTime(todaySeconds)}
                    </p>
                </div>
            </div>

            {/* Mini bar chart */}
            <div className="flex items-end gap-1 h-16">
                {weekData.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                        <div
                            className="w-full rounded-t-md transition-all duration-500"
                            style={{
                                height: `${Math.max((d.hours / maxHours) * 48, 2)}px`,
                                background:
                                    d.day === today
                                        ? "var(--color-accent)"
                                        : "rgba(124,92,255,0.25)",
                            }}
                        />
                        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                            {d.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
