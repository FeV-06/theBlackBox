"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Timer, Zap, Trash2, Crosshair, BarChart2, AlertCircle } from "lucide-react";
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
        setMode,
        setPomodoroWork,
        setPomodoroBreak,
        clearSessions,
    } = useFocusStore();

    const [timerAlert, setTimerAlert] = useState<string | null>(null);

    // Weekly chart data
    const weekDays = getWeekDays();
    const weekData = weekDays.map((day) => {
        const daySeconds = sessions
            .filter((s) => new Date(s.startTime).toISOString().slice(0, 10) === day)
            .reduce((acc, s) => acc + s.duration, 0);
        return { day, label: getDayLabel(day), hours: daySeconds / 3600 };
    });
    const maxHours = Math.max(...weekData.map((d) => d.hours), 1);

    // Stats calculation
    const today = new Date().toISOString().slice(0, 10);
    const todaySessions = sessions.filter(s => new Date(s.startTime).toISOString().slice(0, 10) === today);
    const todayFocusTime = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    const avgDuration = sessions.length ? Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length) : 0;

    // Timer display
    let displayTime = elapsed;
    let phaseLabel = "";
    if (mode === "pomodoro" && isRunning) {
        const limit = pomodoroPhase === "work" ? pomodoroWork * 60 : pomodoroBreak * 60;
        displayTime = limit - elapsed;
        if (displayTime < 0) displayTime = 0;
        phaseLabel = pomodoroPhase === "work" ? "Focus" : "Break";
    }

    // "Best Day" highlight
    const bestDay = [...weekData].sort((a, b) => b.hours - a.hours)[0];

    // Handle Start Validation
    const handleStart = () => {
        if (mode === "pomodoro") {
            if (!pomodoroWork || pomodoroWork <= 0 || !pomodoroBreak || pomodoroBreak <= 0) {
                setTimerAlert("Please set valid duration values for Work and Break greater than 0.");
                return;
            }
        }
        startSession();
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full gap-4 animate-fade-in p-1">
            <AnimatePresence>
                {timerAlert && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                        <AlertCircle size={20} className="text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Invalid Timer Settings</h3>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed mb-6">
                                    {timerAlert}
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => setTimerAlert(null)}
                                        className="px-4 py-2 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/15 text-white transition-colors"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* LEFT SIDE — PRIMARY STACK */}
            <div className="flex flex-col flex-[2] min-h-0 gap-4">
                {/* Timer Section (Dominant) */}
                <div className="flex-[3] flex flex-col items-center justify-center bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 relative">
                    {/* Top Right Mode Switcher */}
                    <div className="absolute top-4 right-4 flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <button
                            onClick={() => setMode("normal")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all`}
                            style={mode === "normal" ? { background: "var(--color-accent-glow)", color: "var(--color-accent)" } : { color: "rgba(255,255,255,0.4)" }}
                        >
                            Normal
                        </button>
                        <button
                            onClick={() => setMode("pomodoro")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all`}
                            style={mode === "pomodoro" ? { background: "var(--color-accent-glow)", color: "var(--color-accent)" } : { color: "rgba(255,255,255,0.4)" }}
                        >
                            Pomodoro
                        </button>
                    </div>

                    {/* Mode label */}
                    {mode === "pomodoro" && isRunning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{
                                background: pomodoroPhase === "work" ? "var(--color-accent-glow)" : "rgba(74,222,128,0.15)",
                                color: pomodoroPhase === "work" ? "var(--color-accent)" : "#4ADE80",
                                border: `1px solid ${pomodoroPhase === "work" ? "color-mix(in srgb, var(--color-accent) 30%, transparent)" : "rgba(74,222,128,0.3)"}`
                            }}
                        >
                            <Zap size={14} />
                            <span className="text-xs font-bold tracking-wider uppercase">{phaseLabel} • C{pomodoroCycles + 1}</span>
                        </motion.div>
                    )}

                    {/* Timer Ring */}
                    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[280px]">
                        <div
                            className="w-[280px] h-[280px] rounded-full flex flex-col items-center justify-center transition-all duration-300 relative"
                            style={{
                                background: "var(--color-accent-glow)",
                                border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
                                boxShadow: isRunning ? `0 0 60px var(--color-accent-glow), inset 0 0 40px color-mix(in srgb, var(--color-accent) 5%, transparent)` : "none",
                            }}
                        >
                            {isRunning && (
                                <motion.div
                                    className="absolute inset-[-4px] rounded-full"
                                    style={{ border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
                                    animate={{ rotate: 360, scale: [1, 1.02, 1] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                />
                            )}
                            <span className="text-6xl font-black font-mono tracking-tighter text-white drop-shadow-md">
                                {mode === "pomodoro" && isRunning ? formatTime(displayTime) : formatTime(elapsed)}
                            </span>
                            {isPaused && (
                                <span className="absolute bottom-16 text-xs font-bold text-white/30 tracking-widest uppercase">PAUSED</span>
                            )}
                        </div>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center justify-center gap-4 mt-4 h-16">
                        {!isRunning ? (
                            <button
                                onClick={handleStart}
                                className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-95 bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            >
                                <Play fill="currentColor" size={24} className="ml-1" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={isPaused ? resumeSession : pauseSession}
                                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1]"
                                >
                                    {isPaused ? <Play fill="currentColor" size={20} className="text-white ml-1" /> : <Pause fill="currentColor" size={20} className="text-white" />}
                                </button>
                                <button
                                    onClick={stopSession}
                                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                                >
                                    <Square fill="currentColor" size={18} className="text-red-400" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Pomodoro Settings (Only visible when not running) - MOVED HERE */}
                {mode === "pomodoro" && !isRunning && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex-none bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 flex items-center justify-center gap-6"
                    >
                        <span className="text-xs font-bold tracking-widest text-white/40 uppercase">Settings</span>
                        <div className="flex gap-4 text-xs font-bold text-white/50 bg-black/40 px-5 py-2.5 rounded-full border border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                WORK
                                <input
                                    type="number"
                                    value={pomodoroWork === 0 ? '' : pomodoroWork}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                                        setPomodoroWork(val);
                                    }}
                                    className="w-10 bg-transparent text-white text-center outline-none border-b border-white/20 group-hover:border-white/40 transition-colors"
                                    style={{ '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                                    min={1} max={120}
                                />
                            </label>
                            <div className="w-px h-4 bg-white/10" />
                            <label className="flex items-center gap-2 cursor-pointer group">
                                BREAK
                                <input
                                    type="number"
                                    value={pomodoroBreak === 0 ? '' : pomodoroBreak}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                                        setPomodoroBreak(val);
                                    }}
                                    className="w-10 bg-transparent text-white text-center outline-none border-b border-white/20 group-hover:border-white/40 transition-colors"
                                    style={{ '--tw-ring-color': 'var(--color-accent)' } as React.CSSProperties}
                                    min={1} max={30}
                                />
                            </label>
                        </div>
                    </motion.div>
                )}

                {/* Live Stats Strip */}
                <div className="flex-[1] grid grid-cols-3 gap-4 min-h-0">
                    <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                        <Crosshair size={100} strokeWidth={1} className="absolute -bottom-6 -right-6 transition-colors" style={{ color: "color-mix(in srgb, var(--color-accent) 5%, transparent)" }} />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Focus Today</span>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--color-accent-glow)" }}>
                                <Crosshair size={14} style={{ color: "var(--color-accent)" }} />
                            </div>
                        </div>
                        <div className="relative z-10 mt-4">
                            <span className="text-3xl xl:text-4xl font-black font-mono tracking-tighter text-white/90 drop-shadow-sm">{formatTime(todayFocusTime)}</span>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Total Logged</p>
                        </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                        <Timer size={100} strokeWidth={1} className="absolute -bottom-6 -right-6 text-[#4ADE80]/[0.05] group-hover:text-[#4ADE80]/[0.1] transition-colors" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Sessions</span>
                            <div className="w-8 h-8 rounded-full bg-[#4ADE80]/10 flex items-center justify-center">
                                <Timer size={14} className="text-[#4ADE80]" />
                            </div>
                        </div>
                        <div className="relative z-10 mt-4">
                            <span className="text-3xl xl:text-4xl font-black font-mono tracking-tighter text-white/90 drop-shadow-sm">{todaySessions.length}</span>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Completed Today</p>
                        </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                        <BarChart2 size={100} strokeWidth={1} className="absolute -bottom-6 -right-6 text-[#FBBF24]/[0.05] group-hover:text-[#FBBF24]/[0.1] transition-colors" />
                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Avg Duration</span>
                            <div className="w-8 h-8 rounded-full bg-[#FBBF24]/10 flex items-center justify-center">
                                <BarChart2 size={14} className="text-[#FBBF24]" />
                            </div>
                        </div>
                        <div className="relative z-10 mt-4">
                            <span className="text-3xl xl:text-4xl font-black font-mono tracking-tighter text-white/90 drop-shadow-sm">{formatTime(avgDuration)}</span>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Overall Average</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE — ACTIVITY PANEL */}
            <div className="flex flex-col flex-[1] min-h-0 gap-4 bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl rounded-2xl p-5">

                {/* Weekly Activity */}
                <div className="flex-1 flex flex-col min-h-0 border-b border-white/[0.05] pb-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-white/80">Weekly Activity</h3>
                            {bestDay && bestDay.hours > 0 && (
                                <p className="text-[10px] font-bold text-[#4ADE80] uppercase tracking-wider mt-1">Best: {bestDay.label} ({bestDay.hours.toFixed(1)}h)</p>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-2">
                        {weekData.map((d) => {
                            const pct = maxHours > 0 ? (d.hours / maxHours) * 100 : 0;
                            const isToday = d.day === weekDays[6];
                            const isEmpty = d.hours === 0;

                            return (
                                <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group relative">
                                    {!isEmpty && (
                                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white px-2 py-0.5 rounded-md whitespace-nowrap z-10 shadow-xl" style={{ background: "var(--color-accent)" }}>
                                            {d.hours.toFixed(1)}h
                                        </div>
                                    )}
                                    <div className="w-full flex-1 flex flex-col justify-end min-h-[4px]">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${pct}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className={`w-full rounded-sm min-h-[4px]`}
                                            style={isToday ? { background: "var(--color-accent)", boxShadow: `0 0 15px var(--color-accent-glow)` } : { background: "rgba(255,255,255,0.15)" }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold" style={{ color: isToday ? "var(--color-accent)" : "rgba(255,255,255,0.4)" }}>{d.label[0]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Session History Sidebar */}
                <div className="flex-1 flex flex-col min-h-0 pt-2">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-white/60 tracking-widest uppercase">Recent Sessions</h4>
                        {sessions.length > 0 && (
                            <button
                                onClick={clearSessions}
                                className="p-1.5 rounded-md hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                                title="Clear History"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                        {sessions.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white/20 uppercase tracking-widest text-center">No Data</span>
                            </div>
                        ) : (
                            sessions.slice(-20).reverse().map((s) => (
                                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ background: s.type === "pomodoro" ? "var(--color-accent)" : "rgba(255,255,255,0.4)" }} />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white/70">{formatTime(s.duration)}</span>
                                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                                                {new Date(s.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
                                        style={s.type === "pomodoro" ? { background: "var(--color-accent-glow)", color: "var(--color-accent)" } : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                                    >
                                        {s.type}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
