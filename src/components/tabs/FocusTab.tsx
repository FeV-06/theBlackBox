"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Play, Pause, Square, Timer, Zap, Trash2, Crosshair, BarChart2, AlertCircle } from "lucide-react";
import { useFocusStore } from "@/store/useFocusStore";
import { useSettingsStore } from "@/store/useSettingsStore";
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
        timerDuration,
        setTimerDuration,
        clearSessions,
    } = useFocusStore();
    const enablePremiumVisuals = useSettingsStore((s) => s.enablePremiumVisuals);

    const [timerAlert, setTimerAlert] = useState<string | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

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
    let isCountdown = mode === "pomodoro" || mode === "timer";

    if (mode === "pomodoro" && isRunning) {
        const limit = pomodoroPhase === "work" ? pomodoroWork * 60 : pomodoroBreak * 60;
        displayTime = limit - elapsed;
        if (displayTime < 0) displayTime = 0;
        phaseLabel = pomodoroPhase === "work" ? "Focus" : "Break";
    } else if (mode === "timer" && isRunning) {
        const target = useFocusStore.getState().timerDuration * 60;
        displayTime = target - elapsed;
        if (displayTime < 0) displayTime = 0;
    }

    // "Best Day" highlight
    const bestDay = [...weekData].sort((a, b) => b.hours - a.hours)[0];

    // Handle Start Validation
    // Mouse Parallax Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

    const parallaxX = useTransform(springX, [0, 1000], [5, -5]);
    const parallaxY = useTransform(springY, [0, 1000], [5, -5]);
    const heavyParallaxX = useTransform(springX, [0, 1000], [15, -15]);
    const heavyParallaxY = useTransform(springY, [0, 1000], [15, -15]);

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };

    const handleStart = () => {
        if (mode === "pomodoro") {
            if (!pomodoroWork || pomodoroWork <= 0 || !pomodoroBreak || pomodoroBreak <= 0) {
                setTimerAlert("Please set valid duration values for Work and Break greater than 0.");
                return;
            }
        } else if (mode === "timer") {
            const timerDuration = useFocusStore.getState().timerDuration;
            if (!timerDuration || timerDuration <= 0) {
                setTimerAlert("Please set a valid Timer duration greater than 0.");
                return;
            }
        }
        startSession();
    };

    const handleStop = () => {
        const prevElapsed = elapsed;
        const target = mode === "timer" ? useFocusStore.getState().timerDuration * 60 : 0;

        stopSession();

        // Celebration Trigger
        if (mode === "timer" && prevElapsed >= target && target > 0) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 4000);
        } else if (mode === "pomodoro" && prevElapsed >= (pomodoroPhase === "work" ? pomodoroWork * 60 : pomodoroBreak * 60)) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 4000);
        }
    };

    const statsStrip = (
        <motion.div
            variants={{
                initial: { opacity: 0 },
                animate: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: 0.4 }
                }
            }}
            initial="initial"
            animate="animate"
            className="flex-1 grid grid-cols-3 gap-2 lg:gap-4 min-h-0 w-full shrink-0"
        >
            <motion.div
                variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-3 lg:p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-white/[0.04] transition-all"
            >
                <Crosshair size={100} strokeWidth={1} className="absolute -bottom-6 -right-6 transition-colors" style={{ color: "color-mix(in srgb, var(--color-accent) 5%, transparent)" }} />
                <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Focus Today</span>
                    <motion.div
                        whileHover={{ rotate: 90 }}
                        className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: "var(--color-accent-glow)" }}
                    >
                        <Crosshair size={12} className="lg:w-3.5 lg:h-3.5" style={{ color: "var(--color-accent)" }} />
                    </motion.div>
                </div>
                <div className="relative z-10 mt-2 lg:mt-4">
                    <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black font-mono tracking-tighter text-white/90 drop-shadow-sm">{formatTime(todayFocusTime)}</span>
                    <p className="text-[8px] lg:text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Total Logged</p>
                </div>
            </motion.div>

            <motion.div
                variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-3 lg:p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-white/[0.04] transition-all"
            >
                <Timer size={100} strokeWidth={1} className="absolute -bottom-6 -right-6 text-[#4ADE80]/[0.05] group-hover:text-[#4ADE80]/[0.1] transition-colors" />
                <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Sessions</span>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#4ADE80]/10 flex items-center justify-center shadow-sm"
                    >
                        <Timer size={12} className="text-[#4ADE80] lg:w-3.5 lg:h-3.5" />
                    </motion.div>
                </div>
                <div className="relative z-10 mt-2 lg:mt-4">
                    <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black font-mono tracking-tighter text-white/90 drop-shadow-sm">{todaySessions.length}</span>
                    <p className="text-[8px] lg:text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Completed Today</p>
                </div>
            </motion.div>

            <motion.div
                variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-3 lg:p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-white/[0.04] transition-all"
            >
                <BarChart2 size={100} strokeWidth={1} className="absolute -bottom-6 -right-6 text-[#FBBF24]/[0.05] group-hover:text-[#FBBF24]/[0.1] transition-colors" />
                <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Avg Duration</span>
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#FBBF24]/10 flex items-center justify-center shadow-sm"
                    >
                        <BarChart2 size={12} className="text-[#FBBF24] lg:w-3.5 lg:h-3.5" />
                    </motion.div>
                </div>
                <div className="relative z-10 mt-2 lg:mt-4">
                    <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black font-mono tracking-tighter text-white/90 drop-shadow-sm">{formatTime(avgDuration)}</span>
                    <p className="text-[8px] lg:text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Overall Average</p>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div
            onMouseMove={handleMouseMove}
            className="relative flex flex-col lg:flex-row h-full w-full gap-4 animate-fade-in p-1 overflow-y-auto lg:overflow-visible snap-y snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
            {/* Fragmentation Layer: Kinetic Background Decoration */}
            <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden"
            >
                <div className="absolute top-0 right-1/4 w-px h-full bg-white shadow-[0_0_15px_white]" />
                <div className="absolute bottom-1/3 left-0 w-full h-px bg-white shadow-[0_0_15px_white]" />
                <motion.div
                    style={{ x: heavyParallaxX, y: heavyParallaxY, rotate: -12 }}
                    className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-white opacity-20"
                />
                {/* Kinetic Grain Layer */}
                <div className="absolute inset-0 noise-overlay opacity-[0.15] mix-blend-overlay" />
            </motion.div>
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

            {/* SCREEN 1: Timer (Mobile) | LEFT COLUMN (Desktop) */}
            <div className="flex flex-col lg:flex-[2] w-full min-h-full lg:min-h-0 h-full lg:h-auto snap-start snap-always shrink-0 gap-4 pb-2 lg:pb-0 relative z-10">
                {/* Timer Section (Dominant) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex-[3] flex flex-col items-center justify-center bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden group/timer"
                >
                    {/* Editorial Watermark - Kinetic Editorial Layering */}
                    <motion.div
                        style={{ x: heavyParallaxX, y: heavyParallaxY, color: "var(--color-text-primary)" }}
                        className="absolute -top-12 opacity-5 select-none pointer-events-none transition-all duration-700 font-black text-9xl tracking-[-0.05em] translate-y-2"
                    >
                        FOCUS
                    </motion.div>

                    {/* Top Right Mode Switcher */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute top-4 right-4 flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] z-10"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMode("normal")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all`}
                            style={mode === "normal" ? { background: "var(--color-accent-glow)", color: "var(--color-accent)" } : { color: "rgba(255,255,255,0.4)" }}
                        >
                            Normal
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMode("pomodoro")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all`}
                            style={mode === "pomodoro" ? { background: "var(--color-accent-glow)", color: "var(--color-accent)" } : { color: "rgba(255,255,255,0.4)" }}
                        >
                            Pomodoro
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMode("timer")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all`}
                            style={mode === "timer" ? { background: "var(--color-accent-glow)", color: "var(--color-accent)" } : { color: "rgba(255,255,255,0.4)" }}
                        >
                            Timer
                        </motion.button>
                    </motion.div>

                    {/* Mode label */}
                    {mode === "pomodoro" && isRunning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
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

                    {mode === "timer" && isRunning && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full z-10"
                            style={{
                                background: "var(--color-accent-glow)",
                                color: "var(--color-accent)",
                                border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)"
                            }}
                        >
                            <Timer size={14} />
                            <span className="text-xs font-bold tracking-wider uppercase">Countdown Mode</span>
                        </motion.div>
                    )}

                    {/* Peak Celebration Overlays */}
                    <AnimatePresence>
                        {showCelebration && enablePremiumVisuals && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.2, rotate: -20 }}
                                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8], rotate: 0 }}
                                transition={{ duration: 4, times: [0, 0.1, 0.8, 1] }}
                                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden"
                            >
                                <motion.span
                                    className="font-black text-9xl tracking-[0.2em] opacity-20 blur-sm absolute"
                                    style={{ color: "var(--color-accent)" }}
                                >
                                    COMPLETE
                                </motion.span>
                                <motion.span
                                    className="font-black text-8xl tracking-tighter"
                                    style={{ color: "var(--color-accent)" }}
                                >
                                    GOAL REACHED
                                </motion.span>
                                {/* Particle fragments could go here if GSAP was available, but we'll use motion.divs */}
                                {[...Array(12)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ x: 0, y: 0, opacity: 1 }}
                                        animate={{ x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600, opacity: 0, rotate: 360 }}
                                        transition={{ duration: 2, delay: 0.1 }}
                                        className="absolute w-2 h-2 bg-[var(--color-accent)] rounded-full"
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Timer Ring */}
                    <motion.div
                        style={{ x: parallaxX, y: parallaxY }}
                        className="relative flex-1 flex flex-col items-center justify-center min-h-[250px] lg:min-h-[280px] w-full mt-8 lg:mt-0"
                    >
                        <div
                            className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full flex flex-col items-center justify-center transition-all duration-700 relative mx-auto"
                            style={{
                                background: "var(--color-accent-glow)",
                                border: "1px solid color-mix(in srgb, var(--color-accent) 20%, transparent)",
                                boxShadow: isRunning ? `0 0 30px var(--color-accent-glow), inset 0 0 20px color-mix(in srgb, var(--color-accent) 5%, transparent)` : "none",
                            }}
                        >
                            <AnimatePresence>
                                {isRunning && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{
                                            opacity: 1,
                                            rotate: 360,
                                            scale: [1, 1.02, 1]
                                        }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute inset-[-4px] rounded-full"
                                        style={{ border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)" }}
                                        transition={{
                                            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                            opacity: { duration: 0.2 }
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tighter text-white drop-shadow-md relative z-10">
                                {isRunning
                                    ? formatTime(displayTime)
                                    : mode === "timer"
                                        ? formatTime(timerDuration * 60)
                                        : mode === "pomodoro"
                                            ? formatTime(pomodoroWork * 60)
                                            : formatTime(elapsed)}
                            </span>
                            {isPaused && (
                                <span className="absolute bottom-12 sm:bottom-16 text-xs font-bold text-white/30 tracking-widest uppercase animate-pulse">PAUSED</span>
                            )}
                        </div>
                    </motion.div>

                    {/* Timer Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center gap-4 mt-6 lg:mt-4 h-16 z-10 shrink-0"
                    >
                        {!isRunning ? (
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.9)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleStart}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 bg-white text-black shadow-lg"
                            >
                                <Play fill="currentColor" size={24} className="ml-1" />
                            </motion.button>
                        ) : (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.15)" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={isPaused ? resumeSession : pauseSession}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1]"
                                >
                                    {isPaused ? <Play fill="currentColor" size={20} className="text-white ml-1" /> : <Pause fill="currentColor" size={20} className="text-white" />}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, backgroundColor: "rgba(239,68,68,0.2)" }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleStop}
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                                >
                                    <Square fill="currentColor" size={18} className="text-red-400" />
                                </motion.button>
                            </>
                        )}
                    </motion.div>
                </motion.div>

                {/* Timer/Pomodoro Settings (Only visible when not running) */}
                {!isRunning && (mode === "pomodoro" || mode === "timer") && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex-none bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
                    >
                        <span className="text-xs font-bold tracking-widest text-white/40 uppercase">Settings</span>
                        <div className="flex gap-4 text-xs font-bold text-white/50 bg-black/40 px-5 py-2.5 rounded-full border border-white/5">
                            {mode === "pomodoro" ? (
                                <>
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
                                            min={1} max={30}
                                        />
                                    </label>
                                </>
                            ) : (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    DURATION
                                    <input
                                        type="number"
                                        value={timerDuration === 0 ? '' : timerDuration}
                                        onChange={(e) => {
                                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                                            setTimerDuration(val);
                                        }}
                                        className="w-10 bg-transparent text-white text-center outline-none border-b border-white/20 group-hover:border-white/40 transition-colors"
                                        min={1} max={480}
                                    />
                                    MINS
                                </label>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Desktop-only Stats Strip (rendered at bottom of Col 1) */}
                <div className="hidden lg:flex flex-[1] min-h-0">
                    {statsStrip}
                </div>
            </div>

            {/* SCREEN 2: Analytics (Mobile) | RIGHT COLUMN (Desktop) */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col lg:flex-[1] w-full min-h-full lg:min-h-0 h-full lg:h-auto snap-start snap-always shrink-0 gap-4 pt-2 lg:pt-0 relative z-10"
            >
                {/* Mobile-only Stats Strip (rendered at top of Screen 2) */}
                <div className="flex lg:hidden flex-none">
                    {statsStrip}
                </div>

                {/* Main Activity Panel */}
                <div className="flex flex-col flex-1 min-h-0 gap-4 bg-white/[0.02] border border-white/[0.04] backdrop-blur-xl rounded-2xl p-5 overflow-hidden">
                    {/* Kinetic Background Fragment for Side Panel */}
                    <motion.div
                        style={{ x: parallaxX, y: parallaxY }}
                        className="absolute top-0 right-0 w-32 h-32 border-b border-l border-white/[0.02] rotate-45 translate-x-16 -translate-y-16 pointer-events-none"
                    />
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
                    <div className="flex-1 flex flex-col min-h-0 pt-2 shrink-0 max-h-[40vh] lg:max-h-none">
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
            </motion.div>
        </div>
    );
}
