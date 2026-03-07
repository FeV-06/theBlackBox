import { useEffect } from "react";
import type { TabId } from "@/types/widget";
import WidgetCanvas from "@/components/widgets/WidgetCanvas";

interface DashboardTabProps {
    onNavigate?: (tab: TabId) => void;
}

import { useSettingsStore } from "@/store/useSettingsStore";
import { useWidgetStore } from "@/store/useWidgetStore";
import { Hammer, Check, Undo2, Redo2, Zap, ZapOff } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import FirstTimeSetupModal from "@/components/widgets/FirstTimeSetupModal";
import CanvasSelector from "@/components/widgets/CanvasSelector";

export default function DashboardTab({ onNavigate }: DashboardTabProps) {
    const {
        dashboardEditMode,
        toggleDashboardEditMode,
        hasCompletedSetup,
        enablePremiumVisuals,
        setEnablePremiumVisuals
    } = useSettingsStore();
    const undo = useWidgetStore((s) => s.undo);
    const redo = useWidgetStore((s) => s.redo);
    const hasPast = useWidgetStore((s) => s.historyPast.length > 0);
    const hasFuture = useWidgetStore((s) => s.historyFuture.length > 0);

    /* ─── Mouse Parallax Logic ─── */
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

    /* ─── Keyboard shortcuts ─── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ignore when typing in inputs
            const tag = (e.target as HTMLElement)?.tagName;
            const editable = (e.target as HTMLElement)?.isContentEditable;
            if (tag === "INPUT" || tag === "TEXTAREA" || editable) return;

            const ctrl = e.ctrlKey || e.metaKey;

            if (ctrl && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                useWidgetStore.getState().undo();
            } else if (ctrl && e.key === "z" && e.shiftKey) {
                e.preventDefault();
                useWidgetStore.getState().redo();
            } else if (ctrl && e.key === "y") {
                e.preventDefault();
                useWidgetStore.getState().redo();
            }

            // Canvas Switching Shortcuts
            if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                const store = useWidgetStore.getState();
                const canvases = store.canvases;
                if (canvases.length <= 1) return;

                const currentIndex = canvases.findIndex(c => c.id === store.activeCanvasId);
                let nextIndex = currentIndex;

                if (e.key === "ArrowRight") {
                    nextIndex = (currentIndex + 1) % canvases.length;
                    store.switchCanvas(canvases[nextIndex].id, 1);
                } else if (e.key === "ArrowLeft") {
                    nextIndex = (currentIndex - 1 + canvases.length) % canvases.length;
                    store.switchCanvas(canvases[nextIndex].id, -1);
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    return (
        <div
            onMouseMove={handleMouseMove}
            className="relative flex flex-col h-full overflow-hidden animate-fade-in md:px-6 md:py-6"
        >
            {/* Fragmentation Layer: Background Decoration (Kinetic) */}
            <motion.div
                style={{ x: parallaxX, y: parallaxY }}
                className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden"
            >
                <div className="absolute top-0 left-1/4 w-px h-full bg-white shadow-[0_0_15px_white]" />
                <div className="absolute top-1/3 left-0 w-full h-px bg-white shadow-[0_0_15px_white]" />
                <motion.div
                    style={{ x: heavyParallaxX, y: heavyParallaxY, rotate: 12 }}
                    className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-white opacity-20"
                />
                {/* Kinetic Grain Layer */}
                {enablePremiumVisuals && <div className="absolute inset-0 noise-overlay opacity-[0.2] mix-blend-overlay" />}
            </motion.div>
            {/* Header controls for Edit Mode — desktop only */}
            <motion.div
                initial="initial"
                animate="animate"
                variants={{
                    initial: { opacity: 0, y: -20 },
                    animate: {
                        opacity: 1,
                        y: 0,
                        transition: {
                            staggerChildren: 0.1,
                            delayChildren: 0.2
                        }
                    }
                }}
                className="hidden md:grid md:grid-cols-3 items-center mb-6 shrink-0 relative"
            >
                {/* Editorial Watermark - Kinetic Editorial Layering (Repositioned) */}
                <motion.div
                    style={{ x: heavyParallaxX, y: heavyParallaxY, color: "var(--color-text-primary)" }}
                    className="absolute -top-12 left-[22%] opacity-5 select-none pointer-events-none transition-all duration-700 font-black text-8xl tracking-[-0.05em] translate-y-2 whitespace-nowrap"
                >
                    DASHBOARD
                </motion.div>
                <motion.div
                    variants={{
                        initial: { opacity: 0, x: -20 },
                        animate: { opacity: 1, x: 0 }
                    }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => setEnablePremiumVisuals(!enablePremiumVisuals)}
                        className={`group relative flex items-center justify-between gap-3 px-3 py-1.5 rounded-full border transition-all duration-500 overflow-hidden ${enablePremiumVisuals
                            ? "bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)] shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : "bg-white/5 border-white/10 text-white/40"
                            }`}
                        title={enablePremiumVisuals ? "Switch to Performance Mode" : "Enable Premium Visuals"}
                    >
                        {/* Animated background pulse for premium mode */}
                        {enablePremiumVisuals && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        )}

                        <div className="flex items-center gap-2 relative z-10">
                            <div className={`p-1 rounded-md transition-colors ${enablePremiumVisuals ? "bg-[var(--color-accent)] text-white shadow-[0_0_10px_var(--color-accent)]" : "bg-white/10"}`}>
                                {enablePremiumVisuals ? <Zap size={10} fill="currentColor" /> : <ZapOff size={10} />}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-black leading-none pt-0.5">
                                {enablePremiumVisuals ? "Premium FX" : "Light Mode"}
                            </span>
                        </div>

                        {/* Custom Toggle Switch Thumb */}
                        <div className={`relative w-8 h-4 rounded-full transition-colors duration-300 ${enablePremiumVisuals ? "bg-[var(--color-accent)]/20" : "bg-white/10"}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${enablePremiumVisuals ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                    </button>
                </motion.div>

                <motion.div
                    variants={{
                        initial: { opacity: 0, scale: 0.95 },
                        animate: { opacity: 1, scale: 1 }
                    }}
                    style={{ x: parallaxX, y: parallaxY }}
                    className="flex flex-col items-center text-center relative"
                >

                    <div className="relative z-10">
                        <CanvasSelector />
                    </div>
                    <p className="text-[10px] mt-2 opacity-40 uppercase tracking-[0.2em] relative z-10" style={{ color: "var(--color-text-secondary)" }}>
                        {dashboardEditMode
                            ? "Geometric Layout Customization Active"
                            : "Daily Operations Control Base"}
                    </p>
                </motion.div>

                <motion.div
                    variants={{
                        initial: { opacity: 0, x: 20 },
                        animate: { opacity: 1, x: 0 }
                    }}
                    className="flex items-center justify-end gap-3"
                >
                    {dashboardEditMode && (
                        <>
                            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-bold animate-pulse px-2 py-1 rounded bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-accent)]">
                                Layout Edit Mode
                            </span>
                            <motion.button
                                whileHover={{ y: -2, boxShadow: "0 0 20px var(--color-accent-glow)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => useWidgetStore.getState().autoArrangeInstances()}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                                title="Auto Arrange Widgets"
                            >
                                Auto Arrange
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={undo}
                                disabled={!hasPast}
                                className="p-2 rounded-lg transition-all duration-200 border border-white/10 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                                style={{ color: "var(--color-text-secondary)" }}
                                title="Undo (Ctrl+Z)"
                            >
                                <Undo2 size={14} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={redo}
                                disabled={!hasFuture}
                                className="p-2 rounded-lg transition-all duration-200 border border-white/10 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                                style={{ color: "var(--color-text-secondary)" }}
                                title="Redo (Ctrl+Shift+Z)"
                            >
                                <Redo2 size={14} />
                            </motion.button>
                        </>
                    )}
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={toggleDashboardEditMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${dashboardEditMode
                            ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/40 shadow-[0_0_20px_var(--color-accent-glow)]"
                            : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/80"
                            }`}
                    >
                        {dashboardEditMode ? (
                            <>
                                <Check size={14} className="animate-bounce-in" />
                                <span>Done</span>
                            </>
                        ) : (
                            <>
                                <Hammer size={14} />
                                <span>Edit Layout</span>
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* Desktop: bordered preview panel; Mobile: raw full-screen deck via WidgetCanvas */}
            <div className={`relative flex-1 min-w-0 overflow-hidden md:rounded-3xl md:bg-black/5 md:border md:border-white/5 group/canvas transition-opacity duration-700 ${!hasCompletedSetup ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Decorative Fragment: Right Sidebar Overlay */}
                <div className="absolute right-0 top-0 w-12 h-full border-l border-white/[0.03] bg-gradient-to-l from-white/[0.01] to-transparent pointer-events-none z-20 hidden md:block" />

                <WidgetCanvas onNavigate={onNavigate} />
            </div>

            {!hasCompletedSetup && <FirstTimeSetupModal />}
        </div>
    );
}
