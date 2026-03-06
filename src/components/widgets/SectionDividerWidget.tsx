"use client";

import { useWidgetStore } from "@/store/useWidgetStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import type { WidgetInstance } from "@/types/widgetInstance";
import { useState, useRef, useEffect } from "react";
import { Pencil, Palette, Check, X, Diamond, Hexagon, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DividerConfig {
    label: string;
    style: "neon-line" | "floating-glass" | "cyber-glow" | "minimal-dots";
    accent?: boolean;
}

const STYLES: ("neon-line" | "floating-glass" | "cyber-glow" | "minimal-dots")[] = [
    "neon-line",
    "floating-glass",
    "cyber-glow",
    "minimal-dots"
];

export default function SectionDividerWidget({ instance }: { instance: WidgetInstance }) {
    const { updateInstanceConfig } = useWidgetStore();
    const dashboardEditMode = useSettingsStore((s) => s.dashboardEditMode);

    // Config values
    const config = (instance.config || {}) as unknown as DividerConfig;
    const label = config.label ?? "New Section";
    const style = config.style ?? "neon-line";
    const accent = config.accent ?? false;

    // Editing state
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editValue.trim()) {
            updateInstanceConfig(instance.instanceId, { label: editValue.trim() });
        } else {
            setEditValue(label); // Revert on empty
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setEditValue(label);
            setIsEditing(false);
        }
    };

    const toggleStyle = () => {
        if (!dashboardEditMode) return;
        const nextStyle = STYLES[(STYLES.indexOf(style) + 1) % STYLES.length];
        updateInstanceConfig(instance.instanceId, { style: nextStyle });
    };

    const LabelText = ({ className = "" }: { className?: string }) => (
        <span
            className={`font-black tracking-[0.2em] md:tracking-[0.3em] uppercase truncate max-w-full 
                transition-all duration-300 transform px-6 py-2 select-none touch-none
                ${accent ? "text-[color:var(--color-accent)] drop-shadow-[0_0_12px_rgba(124,92,255,0.5)]" : "text-white/90 drop-shadow-md"}
                ${dashboardEditMode ? "cursor-text hover:text-white" : "cursor-default"}
                ${className}
            `}
            onDoubleClick={() => dashboardEditMode && setIsEditing(true)}
            title={dashboardEditMode ? "Double-click to edit label" : ""}
        >
            {label}
        </span>
    );

    // Interactive Edit Input
    if (isEditing) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex items-center justify-center pointer-events-auto"
            >
                <div className="relative flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        // Focus blur disabled to allow the action buttons to be clicked without closing prematurely
                        className="bg-black/40 backdrop-blur-xl border border-[color:var(--color-accent)] rounded-lg px-6 py-3 
                            text-center text-xl md:text-2xl font-black text-white outline-none 
                            ring-4 ring-[color:var(--color-accent)]/20 uppercase tracking-widest shadow-2xl"
                        style={{ minWidth: "280px", maxWidth: "80%" }}
                    />
                    <div className="absolute -right-16 flex flex-col gap-2">
                        <button onPointerDown={(e) => { e.preventDefault(); handleSave(); }} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                            <Check size={18} />
                        </button>
                        <button onPointerDown={(e) => { e.preventDefault(); setEditValue(label); setIsEditing(false); }} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    const renderDecoration = () => {
        switch (style) {
            case "floating-glass":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center w-full h-full"
                    >
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl px-10 py-4 
                            backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-5
                            relative overflow-hidden group-hover:bg-white/[0.04] transition-colors duration-500"
                        >
                            {/* Glass Reflections */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/40 to-transparent" />
                            <div className="absolute -inset-x-20 top-0 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

                            <Hexagon className="text-[color:var(--color-accent)] opacity-80" size={20} />
                            <LabelText className="text-xl md:text-2xl pt-1" />
                            <Hexagon className="text-[color:var(--color-accent)] opacity-80" size={20} />
                        </div>
                    </motion.div>
                );

            case "cyber-glow":
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center w-full h-full relative"
                    >
                        <div className="absolute inset-0 flex items-center justify-center opacity-40 blur-[40px] pointer-events-none">
                            <div className="w-[60%] h-[30%] bg-[color:var(--color-accent)] rounded-[100%]" />
                        </div>
                        <LabelText className="text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50" />
                        <div className="h-[3px] w-2/3 md:w-1/2 mt-1 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 blur-[2px]" />
                        </div>
                    </motion.div>
                );

            case "minimal-dots":
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center w-full h-full gap-4 md:gap-8 opacity-80 hover:opacity-100 transition-opacity"
                    >
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <Circle key={`l-${i}`} size={6} fill="currentColor" className="text-white/20" />
                            ))}
                        </div>
                        <LabelText className="text-lg md:text-xl font-bold text-white/70" />
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <Circle key={`r-${i}`} size={6} fill="currentColor" className="text-white/20" />
                            ))}
                        </div>
                    </motion.div>
                );

            case "neon-line":
            default:
                return (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center w-full h-full gap-4 md:gap-6 px-4"
                    >
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[color:var(--color-accent)] to-[color:var(--color-accent)] opacity-60 rounded-full" />
                        <LabelText className="text-[1.1rem] md:text-2xl shadow-sm text-white/90" />
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-[color:var(--color-accent)] to-[color:var(--color-accent)] opacity-60 rounded-full" />
                    </motion.div>
                );
        }
    };

    return (
        <div
            className="w-full h-full relative group tbb-drag-handle"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {renderDecoration()}

            {/* Config Controls (Edit Mode) */}
            <AnimatePresence>
                {dashboardEditMode && !isEditing && isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2
                                 bg-black/60 backdrop-blur-xl rounded-xl p-1.5 border border-white/10 shadow-2xl z-20"
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-[color:var(--color-accent)] hover:shadow-[0_0_12px_var(--color-accent-glow)] transition-all duration-300 pointer-events-auto"
                            title="Rename Section"
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleStyle(); }}
                            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-[color:var(--color-accent)] hover:shadow-[0_0_12px_var(--color-accent-glow)] transition-all duration-300 pointer-events-auto"
                            title="Change Visual Style"
                        >
                            <Palette size={15} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
