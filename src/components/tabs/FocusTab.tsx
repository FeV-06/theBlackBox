"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Square, RotateCcw, Timer, Zap, Trash2 } from "lucide-react";
import { useFocusStore } from "@/store/useFocusStore";
import { formatTime, getWeekDays, getDayLabel } from "@/lib/utils";

export default function FocusTab() {
    const {
        isRunning,
        isPaused,
        elapsed,
        mode,
        pomodoroWork,
        pomodoroBreak,
        pomodoroPhase,
        pomodoroCycles,
        sessions,
        startSession,
        pauseSession,
        resumeSession,
        stopSession,
        tick,
        setMode,
        setPomodoroWork,
        setPomodoroBreak,
        clearSessions,
    } = useFocusStore();



    // Weekly chart data
    const weekDays = getWeekDays();
    const weekData = weekDays.map((day) => {
        const daySeconds = sessions
            .filter((s) => new Date(s.startTime).toISOString().slice(0, 10) === day)
            .reduce((acc, s) => acc + s.duration, 0);
        return { day, label: getDayLabel(day), hours: daySeconds / 3600 };
    });
    const maxHours = Math.max(...weekData.map((d) => d.hours), 1);

    // Timer display
    let displayTime = elapsed;
    let phaseLabel = "";
    if (mode === "pomodoro" && isRunning) {
        const limit = pomodoroPhase === "work" ? pomodoroWork * 60 : pomodoroBreak * 60;
        displayTime = limit - elapsed;
        if (displayTime < 0) displayTime = 0;
        phaseLabel = pomodoroPhase === "work" ? "Focus" : "Break";
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6" style={{ color: "var(--color-text-primary)" }}>
                Focus Mode
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timer section */}
                <div className="glass-card p-4 md:p-6 flex flex-col items-center gap-4 md:gap-6">
                    {/* Mode toggle */}
                    <div className="flex gap-2 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <button
                            onClick={() => setMode("normal")}
                            className="px-4 py-2 text-sm rounded-lg transition-all"
                            style={{
                                background: mode === "normal" ? "var(--color-accent)" : "transparent",
                                color: mode === "normal" ? "white" : "var(--color-text-secondary)",
                            }}
                        >
                            Normal
                        </button>
                        <button
                            onClick={() => setMode("pomodoro")}
                            className="px-4 py-2 text-sm rounded-lg transition-all"
                            style={{
                                background: mode === "pomodoro" ? "var(--color-accent)" : "transparent",
                                color: mode === "pomodoro" ? "white" : "var(--color-text-secondary)",
                            }}
                        >
                            Pomodoro
                        </button>
                    </div>

                    {/* Phase label */}
                    {mode === "pomodoro" && isRunning && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 px-3 py-1 rounded-full"
                            style={{
                                background: pomodoroPhase === "work" ? "rgba(124,92,255,0.15)" : "rgba(74,222,128,0.15)",
                                color: pomodoroPhase === "work" ? "var(--color-accent)" : "var(--color-success)",
                            }}
                        >
                            <Zap size={14} />
                            <span className="text-sm font-medium">{phaseLabel} • Cycle {pomodoroCycles + 1}</span>
                        </motion.div>
                    )}

                    {/* Timer display */}
                    <div className="relative">
                        <div
                            className="w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center"
                            style={{
                                background: "rgba(124,92,255,0.06)",
                                border: "2px solid rgba(124,92,255,0.2)",
                                boxShadow: isRunning ? "0 0 40px rgba(124,92,255,0.15)" : "none",
                            }}
                        >
                            <span className="text-3xl md:text-4xl font-mono font-bold" style={{ color: "var(--color-text-primary)" }}>
                                {mode === "pomodoro" && isRunning ? formatTime(displayTime) : formatTime(elapsed)}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        {!isRunning ? (
                            <button
                                onClick={startSession}
                                className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105"
                                style={{ background: "var(--color-accent)", boxShadow: "0 0 20px rgba(124,92,255,0.3)" }}
                            >
                                <Play size={24} className="text-white ml-1" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={isPaused ? resumeSession : pauseSession}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                                    style={{ background: "rgba(255,255,255,0.08)" }}
                                >
                                    {isPaused ? (
                                        <Play size={20} style={{ color: "var(--color-accent)" }} />
                                    ) : (
                                        <Pause size={20} style={{ color: "var(--color-warning)" }} />
                                    )}
                                </button>
                                <button
                                    onClick={stopSession}
                                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                                    style={{ background: "rgba(248,113,113,0.12)" }}
                                >
                                    <Square size={18} style={{ color: "var(--color-danger)" }} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Pomodoro settings */}
                    {mode === "pomodoro" && !isRunning && (
                        <div className="flex gap-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            <label className="flex items-center gap-2">
                                Work:
                                <input
                                    type="number"
                                    value={pomodoroWork}
                                    onChange={(e) => setPomodoroWork(Number(e.target.value) || 25)}
                                    className="w-12 bg-white/[0.03] border border-[color:var(--color-border)] rounded px-2 py-1 text-center outline-none"
                                    style={{ color: "var(--color-text-primary)" }}
                                    min={1}
                                    max={120}
                                />
                                min
                            </label>
                            <label className="flex items-center gap-2">
                                Break:
                                <input
                                    type="number"
                                    value={pomodoroBreak}
                                    onChange={(e) => setPomodoroBreak(Number(e.target.value) || 5)}
                                    className="w-12 bg-white/[0.03] border border-[color:var(--color-border)] rounded px-2 py-1 text-center outline-none"
                                    style={{ color: "var(--color-text-primary)" }}
                                    min={1}
                                    max={30}
                                />
                                min
                            </label>
                        </div>
                    )}
                </div>

                {/* Activity chart */}
                <div className="glass-card p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                            Weekly Activity
                        </h3>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {sessions.length} sessions total
                        </span>
                    </div>

                    <div className="flex items-end gap-3 h-48 px-2">
                        {weekData.map((d) => {
                            const height = Math.max((d.hours / maxHours) * 160, 4);
                            const isToday = d.day === weekDays[6];
                            return (
                                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>
                                        {d.hours > 0 ? `${d.hours.toFixed(1)}h` : ""}
                                    </span>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height }}
                                        transition={{ duration: 0.6, delay: 0.1 }}
                                        className="w-full rounded-t-lg"
                                        style={{
                                            background: isToday
                                                ? "linear-gradient(180deg, #7C5CFF 0%, #5B3FCC 100%)"
                                                : "rgba(124,92,255,0.25)",
                                            boxShadow: isToday ? "0 0 12px rgba(124,92,255,0.3)" : "none",
                                        }}
                                    />
                                    <span className="text-xs" style={{ color: isToday ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                                        {d.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Session history */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                                Recent Sessions
                            </h4>
                            {sessions.length > 0 && (
                                <button
                                    onClick={clearSessions}
                                    className="text-xs flex items-center gap-1 hover:text-[color:var(--color-danger)] transition-colors"
                                    style={{ color: "var(--color-text-muted)" }}
                                >
                                    <Trash2 size={11} /> Clear
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5 max-h-32 overflow-auto">
                            {sessions.slice(-10).reverse().map((s) => (
                                <div key={s.id} className="flex items-center gap-2 text-xs py-1">
                                    <Timer size={11} style={{ color: "var(--color-accent)" }} />
                                    <span style={{ color: "var(--color-text-secondary)" }}>
                                        {new Date(s.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                    <span className="flex-1" style={{ color: "var(--color-text-muted)" }}>
                                        {formatTime(s.duration)}
                                    </span>
                                    <span
                                        className="px-1.5 py-0.5 rounded text-[10px]"
                                        style={{
                                            background: s.type === "pomodoro" ? "rgba(124,92,255,0.12)" : "rgba(255,255,255,0.04)",
                                            color: s.type === "pomodoro" ? "var(--color-accent)" : "var(--color-text-muted)",
                                        }}
                                    >
                                        {s.type}
                                    </span>
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                                    No sessions yet. Start focusing!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
