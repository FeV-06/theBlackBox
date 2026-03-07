"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { registryMap } from "@/lib/widgetRegistry";
import type { WidgetInstance } from "@/types/widgetInstance";
import { widgetTemplateRegistry } from "@/widgets/registry";
import { LayoutGrid } from "lucide-react";

interface MobileLaunchpadProps {
    widgets: WidgetInstance[];
    onFocus: (id: string) => void;
    canvasName?: string;
    canvasesCount?: number;
    currentCanvasIndex?: number;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.03,
            ease: [0.16, 1, 0.3, 1] as const
        },
    },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 350, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

export default function MobileLaunchpad({
    widgets,
    onFocus,
    canvasName = "Dashboard",
    canvasesCount = 1,
    currentCanvasIndex = 0
}: MobileLaunchpadProps) {
    const [jumpOpen, setJumpOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!jumpOpen) return;
        const handlePointerDown = (e: PointerEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setJumpOpen(false);
            }
        };
        window.addEventListener("pointerdown", handlePointerDown);
        return () => window.removeEventListener("pointerdown", handlePointerDown);
    }, [jumpOpen]);

    const now = new Date();
    const greeting =
        now.getHours() < 12 ? "Good morning" :
            now.getHours() < 17 ? "Good afternoon" : "Good evening";

    return (
        <motion.div
            key="launchpad"
            // Fully-fixed height, no overflow at the top level — prevents page scroll
            className="absolute inset-0 flex flex-col"
            style={{ background: "var(--color-bg)", overflowY: "hidden" }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* ── Header ── */}
            <motion.div
                className="flex-shrink-0 px-5 pt-10 pb-3 flex justify-between items-start"
                variants={cardVariants}
            >
                <div>
                    <p className="text-[11px] font-medium tracking-[0.18em] uppercase mb-1"
                        style={{ color: "var(--color-text-muted)" }}>
                        {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight"
                        style={{ color: "var(--color-text-primary)" }}>
                        {greeting} ✦
                    </h1>
                </div>

                {/* Canvas Indicator */}
                {canvasesCount > 1 && (
                    <div className="flex flex-col items-end gap-1.5 mt-1">
                        <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 pb-[3px]">
                            {canvasName}
                        </span>
                        <div className="flex items-center gap-1.5 pr-1">
                            {Array.from({ length: canvasesCount }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentCanvasIndex
                                        ? "w-3 bg-white/80"
                                        : "w-1.5 bg-white/20"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Widget Grid — auto stretches to fill space ── */}
            <div
                className="flex-1 px-3 pb-24 overflow-y-auto overscroll-y-contain flex flex-col"
                style={{ touchAction: "pan-y" }}
            >
                <div className="grid grid-cols-2 gap-2.5">
                    <AnimatePresence mode="popLayout">
                        {widgets.map((inst, index) => {
                            const def = registryMap.get(inst.type);
                            const manifest = !def ? widgetTemplateRegistry.get(inst.type) : null;

                            if (!def && !manifest) return null;

                            const Icon = def?.icon || LayoutGrid;
                            const label = inst.title || def?.defaultTitle || manifest?.name || inst.type;

                            return (
                                <motion.button
                                    layout
                                    key={inst.instanceId}
                                    initial={{ opacity: 0, y: 16, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25, delay: Math.min(index * 0.05, 0.3) }}
                                    whileTap={{ scale: 0.96 }}
                                    onTap={() => onFocus(inst.instanceId)}
                                    className="relative flex flex-col items-start justify-between rounded-[24px] p-5 cursor-pointer text-left overflow-hidden min-h-[120px]"
                                    style={{
                                        height: "100%",
                                        background: "var(--color-bg-card)",
                                        border: "1px solid var(--color-border)",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                        WebkitTapHighlightColor: "transparent",
                                    }}
                                >
                                    {/* Subtle accent glow */}
                                    <div
                                        className="absolute inset-0 pointer-events-none opacity-60"
                                        style={{
                                            background: "radial-gradient(ellipse at center top, var(--color-accent-glow) 0%, transparent 80%)",
                                        }}
                                    />
                                    <div
                                        className="flex items-center justify-center w-10 h-10 rounded-2xl z-10 flex-shrink-0 mb-4"
                                        style={{
                                            background: "var(--color-bg-elevated)",
                                            border: "1px solid var(--color-border-hover)",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                        }}
                                    >
                                        <Icon className="w-[18px] h-[18px]" style={{ color: "var(--color-accent)" }} strokeWidth={2} />
                                    </div>
                                    <p className="text-[14px] font-medium leading-snug tracking-tight z-10"
                                        style={{ color: "var(--color-text-primary)" }}>
                                        {label}
                                    </p>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Jump Button (Floating above bottom nav area) ── */}
            <div
                ref={dropdownRef}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-50"
            >
                {/* Dropdown renders upward */}
                {jumpOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mb-2 w-52 rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            background: "var(--color-bg-elevated)",
                            border: "1px solid var(--color-border-hover)",
                        }}
                    >
                        <p className="px-4 pt-3 pb-1.5 text-[10px] font-semibold tracking-widest uppercase"
                            style={{ color: "var(--color-text-muted)" }}>
                            Jump to
                        </p>
                        <div className="max-h-64 overflow-y-auto overscroll-contain">
                            {widgets.map((inst) => {
                                const def = registryMap.get(inst.type);
                                const manifest = !def ? widgetTemplateRegistry.get(inst.type) : null;

                                if (!def && !manifest) return null;

                                const Icon = def?.icon || LayoutGrid;
                                return (
                                    <button
                                        key={inst.instanceId}
                                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                                        onClick={() => {
                                            setJumpOpen(false);
                                            onFocus(inst.instanceId);
                                        }}
                                    >
                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} strokeWidth={1.8} />
                                        <span className="text-[13px] truncate" style={{ color: "var(--color-text-secondary)" }}>
                                            {inst.title || def?.defaultTitle || manifest?.name || inst.type}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="h-2" />
                    </motion.div>
                )}

                {/* Pill Button */}
                <motion.button
                    whileTap={{ scale: 0.93 }}
                    onTap={() => setJumpOpen((v) => !v)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium shadow-xl select-none"
                    style={{
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border-hover)",
                        color: "var(--color-text-secondary)",
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    <span>Jump</span>
                    <motion.span
                        animate={{ rotate: jumpOpen ? 180 : 0 }}
                        transition={{ duration: 0.22 }}
                    >
                        <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
                    </motion.span>
                </motion.button>
            </div>
        </motion.div>
    );
}
